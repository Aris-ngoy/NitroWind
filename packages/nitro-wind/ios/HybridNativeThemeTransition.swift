import UIKit
import NitroModules

public final class HybridNativeThemeTransition: HybridNativeThemeTransitionSpec {
  private static var overlayWindow: UIWindow?
  private static var currentPreset: ThemeTransitionPreset = .none
  private static var currentDuration: Double = 0.35
  private static var currentOrigin: CGPoint?
  private static var cleanupWorkItem: DispatchWorkItem?

  public override init() {
    super.init()
  }

  public func isAvailable() throws -> Bool {
    return true
  }

  public func prepareTransition(
    preset: ThemeTransitionPreset,
    targetTheme: String,
    durationMs: Double?,
    origin: TransitionOrigin?
  ) throws {
    let duration = (durationMs ?? 350.0) / 1000.0

    let originPoint: CGPoint? = origin != nil ? CGPoint(x: origin!.x, y: origin!.y) : nil

    DispatchQueue.main.async {
      Self.cleanupWorkItem?.cancel()
      Self.cleanupWorkItem = nil

      if preset == .none {
        Self.cleanupOrphanedSnapshot()
        return
      }

      guard let keyWindow = Self.findKeyWindow() else { return }

      // Take a snapshot view of current window before theme changes
      guard let snapshot = keyWindow.snapshotView(afterScreenUpdates: false) else { return }

      // If an existing overlay was open, remove it
      Self.overlayWindow?.isHidden = true
      Self.overlayWindow = nil

      // Create overlay window over key window
      let windowScene = keyWindow.windowScene
      let overlay: UIWindow
      if let scene = windowScene {
        overlay = UIWindow(windowScene: scene)
      } else {
        overlay = UIWindow(frame: keyWindow.bounds)
      }

      overlay.frame = keyWindow.bounds
      overlay.windowLevel = UIWindow.Level.statusBar + 1
      overlay.isUserInteractionEnabled = false

      let rootVC = UIViewController()
      rootVC.view.backgroundColor = .clear
      snapshot.frame = overlay.bounds
      snapshot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      rootVC.view.addSubview(snapshot)

      overlay.rootViewController = rootVC
      overlay.isHidden = false

      Self.overlayWindow = overlay
      Self.currentPreset = preset
      Self.currentDuration = max(0.1, min(2.0, duration))
      Self.currentOrigin = originPoint

      // Safety timeout in case animateTransition or commit is never called
      let workItem = DispatchWorkItem {
        Self.cleanupOrphanedSnapshot()
      }
      Self.cleanupWorkItem = workItem
      DispatchQueue.main.asyncAfter(deadline: .now() + 2.0, execute: workItem)
    }
  }

  public func animateTransition(
    appearance: AppearanceOverride,
    preAnimationCallback: @escaping () -> Void
  ) throws {
    DispatchQueue.main.async {
      Self.cleanupWorkItem?.cancel()
      Self.cleanupWorkItem = nil

      // Execute preAnimationCallback to commit the theme in JS/React underneath
      preAnimationCallback()

      // Override appearance on the key window if needed
      Self.overrideAppearance(appearance)

      guard let overlay = Self.overlayWindow,
            let containerView = overlay.rootViewController?.view else {
        Self.cleanupOrphanedSnapshot()
        return
      }

      let preset = Self.currentPreset
      let duration = Self.currentDuration
      let origin = Self.currentOrigin

      // Run animation on next runloop tick after React updates layout underneath
      DispatchQueue.main.async {
        switch preset {
        case .none:
          Self.cleanupOrphanedSnapshot()

        case .fade:
          UIView.animate(withDuration: duration, delay: 0, options: [.curveEaseInOut], animations: {
            containerView.alpha = 0.0
          }, completion: { _ in
            Self.cleanupOrphanedSnapshot()
          })

        case .slidelefttoright:
          let width = containerView.bounds.width
          UIView.animate(withDuration: duration, delay: 0, options: [.curveEaseOut], animations: {
            containerView.transform = CGAffineTransform(translationX: width, y: 0)
          }, completion: { _ in
            Self.cleanupOrphanedSnapshot()
          })

        case .sliderighttoleft:
          let width = containerView.bounds.width
          UIView.animate(withDuration: duration, delay: 0, options: [.curveEaseOut], animations: {
            containerView.transform = CGAffineTransform(translationX: -width, y: 0)
          }, completion: { _ in
            Self.cleanupOrphanedSnapshot()
          })

        case .slidefromorigin:
          let width = containerView.bounds.width
          let ox = origin?.x ?? (width / 2)
          let translationX = ox < (width / 2) ? width : -width
          UIView.animate(withDuration: duration, delay: 0, options: [.curveEaseOut], animations: {
            containerView.transform = CGAffineTransform(translationX: translationX, y: 0)
          }, completion: { _ in
            Self.cleanupOrphanedSnapshot()
          })

        case .circlecenter, .circletopright, .circletopleft, .circlebottomright, .circlebottomleft, .circlefromorigin:
          let center = Self.resolveCenter(for: preset, in: containerView.bounds, customOrigin: origin)
          Self.animateCircleReveal(containerView: containerView, center: center, duration: duration)

        case .blur, .blurrighttoleft, .blurlefttoright, .blurfromorigin:
          Self.animateBlurTransition(containerView: containerView, duration: duration)
        }
      }
    }
  }

  public func cancelTransition() throws {
    DispatchQueue.main.async {
      Self.cleanupOrphanedSnapshot()
    }
  }

  // MARK: - Private Helpers

  private static func findKeyWindow() -> UIWindow? {
    if #available(iOS 13.0, *) {
      let scenes = UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .filter { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }

      for scene in scenes {
        if let keyWindow = scene.windows.first(where: { $0.isKeyWindow }) {
          return keyWindow
        }
        if let firstWindow = scene.windows.first {
          return firstWindow
        }
      }
    }
    return UIApplication.shared.keyWindow
  }

  private static func resolveCenter(for preset: ThemeTransitionPreset, in bounds: CGRect, customOrigin: CGPoint?) -> CGPoint {
    let w = bounds.width
    let h = bounds.height
    switch preset {
    case .circletopright:
      return CGPoint(x: w, y: 0)
    case .circletopleft:
      return CGPoint(x: 0, y: 0)
    case .circlebottomright:
      return CGPoint(x: w, y: h)
    case .circlebottomleft:
      return CGPoint(x: 0, y: h)
    case .circlefromorigin:
      return customOrigin ?? CGPoint(x: w / 2, y: h / 2)
    case .circlecenter:
      fallthrough
    default:
      return CGPoint(x: w / 2, y: h / 2)
    }
  }

  private static func animateCircleReveal(containerView: UIView, center: CGPoint, duration: Double) {
    let bounds = containerView.bounds
    let maxRadius = hypot(max(center.x, bounds.width - center.x), max(center.y, bounds.height - center.y)) * 1.1

    // Inverted mask: hole expands from center outwards
    let maskLayer = CAShapeLayer()
    maskLayer.frame = bounds
    maskLayer.fillRule = .evenOdd
    maskLayer.fillColor = UIColor.black.cgColor
    maskLayer.strokeColor = nil
    maskLayer.lineWidth = 0

    // Inset bounds slightly outward to ensure outer screen edges are fully covered without subpixel gaps
    let outerRect = bounds.insetBy(dx: -10, dy: -10)

    let startPath = CGMutablePath()
    startPath.addRect(outerRect)
    startPath.addEllipse(in: CGRect(x: center.x - 0.1, y: center.y - 0.1, width: 0.2, height: 0.2))

    let endPath = CGMutablePath()
    endPath.addRect(outerRect)
    endPath.addEllipse(in: CGRect(x: center.x - maxRadius, y: center.y - maxRadius, width: maxRadius * 2, height: maxRadius * 2))

    maskLayer.path = endPath
    containerView.layer.mask = maskLayer

    CATransaction.begin()
    CATransaction.setCompletionBlock {
      containerView.layer.mask = nil
      Self.cleanupOrphanedSnapshot()
    }

    let animation = CABasicAnimation(keyPath: "path")
    animation.fromValue = startPath
    animation.toValue = endPath
    animation.duration = duration
    animation.timingFunction = CAMediaTimingFunction(name: .easeOut)
    animation.fillMode = .forwards
    animation.isRemovedOnCompletion = false

    maskLayer.add(animation, forKey: "circleRevealAnimation")
    CATransaction.commit()
  }

  private static func animateBlurTransition(containerView: UIView, duration: Double) {
    let blurEffect = UIBlurEffect(style: .regular)
    let blurView = UIVisualEffectView(effect: nil)
    blurView.frame = containerView.bounds
    blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    containerView.addSubview(blurView)

    UIView.animate(withDuration: duration * 0.5, animations: {
      blurView.effect = blurEffect
    }, completion: { _ in
      UIView.animate(withDuration: duration * 0.5, animations: {
        containerView.alpha = 0.0
      }, completion: { _ in
        Self.cleanupOrphanedSnapshot()
      })
    })
  }

  private static func overrideAppearance(_ appearance: AppearanceOverride) {
    if #available(iOS 13.0, *) {
      guard let window = findKeyWindow() else { return }
      let style: UIUserInterfaceStyle
      switch appearance {
      case .light:
        style = .light
      case .dark:
        style = .dark
      default:
        style = .unspecified
      }
      window.overrideUserInterfaceStyle = style
    }
  }

  private static func cleanupOrphanedSnapshot() {
    cleanupWorkItem?.cancel()
    cleanupWorkItem = nil
    overlayWindow?.rootViewController?.view.layer.mask = nil
    overlayWindow?.isHidden = true
    overlayWindow?.rootViewController = nil
    overlayWindow = nil
    currentPreset = .none
    currentOrigin = nil
  }
}
