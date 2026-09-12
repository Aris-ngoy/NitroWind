package com.nitrowind

import android.content.Context
import android.graphics.Canvas
import android.graphics.Path
import android.view.MotionEvent
import android.widget.ImageView

/**
 * Full-screen snapshot of the previous theme. Circle presets punch an expanding
 * even-odd hole so the new theme is revealed from the origin — matching iOS
 * `CAShapeLayer` fillRule = evenOdd.
 */
internal class SnapshotOverlayView(context: Context) : ImageView(context) {
  private val holePath = Path()
  private var holeCenterX = 0f
  private var holeCenterY = 0f
  private var holeRadius = 0f
  private var holeEnabled = false

  init {
    scaleType = ScaleType.FIT_XY
    isClickable = false
    isFocusable = false
  }

  fun setHole(centerX: Float, centerY: Float, radius: Float) {
    holeEnabled = true
    holeCenterX = centerX
    holeCenterY = centerY
    holeRadius = radius
    invalidate()
  }

  fun clearHole() {
    holeEnabled = false
    holeRadius = 0f
    invalidate()
  }

  override fun dispatchTouchEvent(event: MotionEvent): Boolean = false

  override fun onDraw(canvas: Canvas) {
    if (!holeEnabled || holeRadius <= 0f) {
      super.onDraw(canvas)
      return
    }

    val save = canvas.save()
    holePath.reset()
    holePath.fillType = Path.FillType.EVEN_ODD
    holePath.addRect(-10f, -10f, width + 10f, height + 10f, Path.Direction.CW)
    holePath.addCircle(holeCenterX, holeCenterY, holeRadius, Path.Direction.CW)
    canvas.clipPath(holePath)
    super.onDraw(canvas)
    canvas.restoreToCount(save)
  }
}
