package com.nitrowind

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PointF
import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import androidx.annotation.Keep
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.nitrowind.AppearanceOverride
import com.margelo.nitro.nitrowind.HybridNativeThemeTransitionSpec
import com.margelo.nitro.nitrowind.ThemeTransitionPreset
import com.margelo.nitro.nitrowind.TransitionOrigin
import kotlin.math.hypot
import kotlin.math.max

@DoNotStrip
@Keep
class HybridNativeThemeTransition : HybridNativeThemeTransitionSpec() {
  override fun isAvailable(): Boolean = true

  override fun prepareTransition(
    preset: ThemeTransitionPreset,
    targetTheme: String,
    durationMs: Double?,
    origin: TransitionOrigin?,
  ) {
    val duration = ((durationMs ?: 350.0) / 1000.0).coerceIn(MIN_DURATION, MAX_DURATION)
    val originPoint = origin?.let { PointF(it.x.toFloat(), it.y.toFloat()) }

    mainHandler.post {
      cancelSafetyTimeout()

      if (preset == ThemeTransitionPreset.NONE) {
        cleanupOrphanedSnapshot()
        return@post
      }

      val activity = CurrentActivityHolder.current() ?: return@post

      currentPreset = preset
      currentDuration = duration
      currentOrigin = originPoint
      snapshotReady = false
      pendingAnimate = null
      cleanupOverlayOnly()
      scheduleSafetyTimeout()

      captureSnapshot(activity) { bitmap ->
        if (bitmap == null) {
          snapshotReady = true
          pendingAnimate?.invoke()
          pendingAnimate = null
          return@captureSnapshot
        }
        attachOverlay(activity, bitmap)
        snapshotReady = true
        pendingAnimate?.invoke()
        pendingAnimate = null
      }
    }
  }

  override fun animateTransition(
    appearance: AppearanceOverride,
    preAnimationCallback: () -> Unit,
  ) {
    mainHandler.post {
      val run = {
        cancelSafetyTimeout()
        preAnimationCallback()
        overrideAppearance(appearance)

        val overlay = overlayView
        if (overlay == null) {
          cleanupOrphanedSnapshot()
        } else {
          overlay.post { startAnimation(overlay) }
        }
        Unit
      }

      if (snapshotReady) {
        run()
      } else {
        pendingAnimate = run
      }
    }
  }

  override fun cancelTransition() {
    mainHandler.post { cleanupOrphanedSnapshot() }
  }

  private fun startAnimation(overlay: SnapshotOverlayView) {
    val preset = currentPreset
    val durationMs = (currentDuration * 1000).toLong()
    val origin = currentOrigin

    when (preset) {
      ThemeTransitionPreset.NONE -> cleanupOrphanedSnapshot()

      ThemeTransitionPreset.FADE ->
        overlay
          .animate()
          .alpha(0f)
          .setDuration(durationMs)
          .setInterpolator(AccelerateDecelerateInterpolator())
          .withEndAction { cleanupOrphanedSnapshot() }
          .start()

      ThemeTransitionPreset.SLIDELEFTTORIGHT ->
        slideOverlay(overlay, overlay.width.toFloat(), durationMs)

      ThemeTransitionPreset.SLIDERIGHTTOLEFT ->
        slideOverlay(overlay, -overlay.width.toFloat(), durationMs)

      ThemeTransitionPreset.SLIDEFROMORIGIN -> {
        val width = overlay.width.toFloat()
        val density = overlay.resources.displayMetrics.density
        val originX = (origin?.x ?: (width / density / 2f)) * density
        val translationX = if (originX < width / 2f) width else -width
        slideOverlay(overlay, translationX, durationMs)
      }

      ThemeTransitionPreset.CIRCLECENTER,
      ThemeTransitionPreset.CIRCLETOPRIGHT,
      ThemeTransitionPreset.CIRCLETOPLEFT,
      ThemeTransitionPreset.CIRCLEBOTTOMRIGHT,
      ThemeTransitionPreset.CIRCLEBOTTOMLEFT,
      ThemeTransitionPreset.CIRCLEFROMORIGIN,
      -> {
        val center = resolveCenter(preset, overlay, origin)
        animateCircleReveal(overlay, center, currentDuration)
      }

      ThemeTransitionPreset.BLUR,
      ThemeTransitionPreset.BLURRIGHTTOLEFT,
      ThemeTransitionPreset.BLURLEFTTORIGHT,
      ThemeTransitionPreset.BLURFROMORIGIN,
      -> animateBlurTransition(overlay, currentDuration)
    }
  }

  private fun slideOverlay(overlay: View, translationX: Float, durationMs: Long) {
    overlay
      .animate()
      .translationX(translationX)
      .setDuration(durationMs)
      .setInterpolator(DecelerateInterpolator())
      .withEndAction { cleanupOrphanedSnapshot() }
      .start()
  }

  private fun resolveCenter(
    preset: ThemeTransitionPreset,
    overlay: View,
    origin: PointF?,
  ): PointF {
    val w = overlay.width.toFloat()
    val h = overlay.height.toFloat()
    val density = overlay.resources.displayMetrics.density
    return when (preset) {
      ThemeTransitionPreset.CIRCLETOPRIGHT -> PointF(w, 0f)
      ThemeTransitionPreset.CIRCLETOPLEFT -> PointF(0f, 0f)
      ThemeTransitionPreset.CIRCLEBOTTOMRIGHT -> PointF(w, h)
      ThemeTransitionPreset.CIRCLEBOTTOMLEFT -> PointF(0f, h)
      ThemeTransitionPreset.CIRCLEFROMORIGIN -> {
        if (origin != null) {
          PointF(origin.x * density, origin.y * density)
        } else {
          PointF(w / 2f, h / 2f)
        }
      }
      else -> PointF(w / 2f, h / 2f)
    }
  }

  private fun animateCircleReveal(overlay: SnapshotOverlayView, center: PointF, durationSec: Double) {
    val boundsW = overlay.width.toFloat()
    val boundsH = overlay.height.toFloat()
    val maxRadius = hypot(
      max(center.x, boundsW - center.x).toDouble(),
      max(center.y, boundsH - center.y).toDouble(),
    ).toFloat() * 1.1f

    if (Build.VERSION.SDK_INT < 28) {
      overlay.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    }

    runningAnimator?.cancel()
    val animator = ValueAnimator.ofFloat(0.1f, maxRadius).apply {
      duration = (durationSec * 1000).toLong()
      interpolator = DecelerateInterpolator()
      addUpdateListener { animation ->
        overlay.setHole(center.x, center.y, animation.animatedValue as Float)
      }
      addListener(
        object : AnimatorListenerAdapter() {
          override fun onAnimationEnd(animation: Animator) {
            overlay.clearHole()
            cleanupOrphanedSnapshot()
          }

          override fun onAnimationCancel(animation: Animator) {
            overlay.clearHole()
          }
        },
      )
    }
    runningAnimator = animator
    animator.start()
  }

  private fun animateBlurTransition(overlay: SnapshotOverlayView, durationSec: Double) {
    val halfMs = (durationSec * 500).toLong()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      runningAnimator?.cancel()
      val animator = ValueAnimator.ofFloat(0.1f, BLUR_RADIUS).apply {
        duration = halfMs
        interpolator = AccelerateDecelerateInterpolator()
        addUpdateListener { animation ->
          val radius = animation.animatedValue as Float
          overlay.setRenderEffect(
            RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP),
          )
        }
        addListener(
          object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: Animator) {
              overlay
                .animate()
                .alpha(0f)
                .setDuration(halfMs)
                .setInterpolator(AccelerateDecelerateInterpolator())
                .withEndAction { cleanupOrphanedSnapshot() }
                .start()
            }
          },
        )
      }
      runningAnimator = animator
      animator.start()
      return
    }

    overlay
      .animate()
      .alpha(0f)
      .setDuration((durationSec * 1000).toLong())
      .setInterpolator(AccelerateDecelerateInterpolator())
      .withEndAction { cleanupOrphanedSnapshot() }
      .start()
  }

  private fun overrideAppearance(appearance: AppearanceOverride) {
    val activity = CurrentActivityHolder.current() ?: return

    if (activity is AppCompatActivity) {
      activity.delegate.localNightMode = when (appearance) {
        AppearanceOverride.LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
        AppearanceOverride.DARK -> AppCompatDelegate.MODE_NIGHT_YES
        AppearanceOverride.UNSPECIFIED -> AppCompatDelegate.MODE_NIGHT_UNSPECIFIED
      }
    }

    val window = activity.window
    val controller = WindowInsetsControllerCompat(window, window.decorView)
    when (appearance) {
      AppearanceOverride.LIGHT -> {
        controller.isAppearanceLightStatusBars = true
        controller.isAppearanceLightNavigationBars = true
      }
      AppearanceOverride.DARK -> {
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
      }
      AppearanceOverride.UNSPECIFIED -> Unit
    }
  }

  private fun captureSnapshot(activity: Activity, onReady: (Bitmap?) -> Unit) {
    val window = activity.window
    val decor = window.decorView
    val width = decor.width.takeIf { it > 0 } ?: activity.resources.displayMetrics.widthPixels
    val height = decor.height.takeIf { it > 0 } ?: activity.resources.displayMetrics.heightPixels
    if (width <= 0 || height <= 0) {
      onReady(null)
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      try {
        PixelCopy.request(window, bitmap, { result ->
          if (result == PixelCopy.SUCCESS) {
            onReady(bitmap)
          } else {
            bitmap.recycle()
            onReady(drawDecorView(decor, width, height))
          }
        }, mainHandler)
      } catch (_: Throwable) {
        bitmap.recycle()
        onReady(drawDecorView(decor, width, height))
      }
      return
    }

    onReady(drawDecorView(decor, width, height))
  }

  private fun drawDecorView(decor: View, width: Int, height: Int): Bitmap? {
    return try {
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      decor.draw(canvas)
      bitmap
    } catch (_: Throwable) {
      null
    }
  }

  private fun attachOverlay(activity: Activity, bitmap: Bitmap) {
    cleanupOverlayOnly()

    val overlay = SnapshotOverlayView(activity)
    overlay.setImageBitmap(bitmap)
    overlayView = overlay
    snapshotBitmap = bitmap

    val decor = activity.window.decorView as ViewGroup
    if (overlay.parent != null) {
      (overlay.parent as? ViewGroup)?.removeView(overlay)
    }
    decor.addView(
      overlay,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )
    android.util.Log.i(
      "NitroWind",
      "Theme overlay attached to decorView children=${decor.childCount}",
    )
  }

  private fun cleanupOrphanedSnapshot() {
    cancelSafetyTimeout()
    pendingAnimate = null
    snapshotReady = true
    currentPreset = ThemeTransitionPreset.NONE
    currentOrigin = null
    cleanupOverlayOnly()
  }

  private fun cleanupOverlayOnly() {
    runningAnimator?.cancel()
    runningAnimator = null
    overlayView?.animate()?.cancel()

    val overlay = overlayView
    overlayView = null
    if (overlay != null) {
      try {
        (overlay.parent as? ViewGroup)?.removeView(overlay)
      } catch (_: Throwable) {
      }
    }

    snapshotBitmap?.recycle()
    snapshotBitmap = null
  }

  private fun scheduleSafetyTimeout() {
    mainHandler.removeCallbacks(safetyRunnable)
    mainHandler.postDelayed(safetyRunnable, SAFETY_TIMEOUT_MS)
  }

  private fun cancelSafetyTimeout() {
    mainHandler.removeCallbacks(safetyRunnable)
  }

  private val safetyRunnable = Runnable { cleanupOrphanedSnapshot() }

  companion object {
    private const val MIN_DURATION = 0.1
    private const val MAX_DURATION = 2.0
    private const val BLUR_RADIUS = 25f
    private const val SAFETY_TIMEOUT_MS = 2_000L

    private val mainHandler = Handler(Looper.getMainLooper())

    private var overlayView: SnapshotOverlayView? = null
    private var snapshotBitmap: Bitmap? = null
    private var currentPreset: ThemeTransitionPreset = ThemeTransitionPreset.NONE
    private var currentDuration: Double = 0.35
    private var currentOrigin: PointF? = null
    private var snapshotReady = true
    private var pendingAnimate: (() -> Unit)? = null
    private var runningAnimator: ValueAnimator? = null
  }
}
