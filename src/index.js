// Test import of styles
import '@/styles/index.scss'
import $ from 'jquery'
import makeMarioModel from './js/mario'
import makeKirbyModel from './js/kirby'

$(document).ready(() => {
  var sliderOffsetLeft = 0
  var sliderWidth = 0
  var scrollLeft = 0
  var mousedown = false
  var needsPositionUpdate = false
  var currentSlide = 0
  const $slider = $(`#doggie-slider`)
  const $slides = $(`#doggie-slider > .slide`)

  // Scrolls to an slide based on the slide index
  function goToSlide({ index }) {
    if ($slides[index]) {
      $slider.scrollLeft(index * sliderWidth)
      currentSlide = index
    }
  }

  function goToNextSlide() {
    const isLast = currentSlide === $slides.length - 1
    goToSlide({ index: isLast ? 0 : currentSlide + 1 })
  }

  function goToPrevSlide() {
    const isFirst = currentSlide === 0
    goToSlide({ index: isFirst ? $slides.length - 1 : currentSlide - 1 })
  }

  /**
   *  @function {int} getSlideRelativePosition
   *  Returns the slide position relative to the slider left side
   *  -1 => is the previous slide
   *  0 => is current slide
   *  1 => is the next slide
   */
  function getSlideRelativePosition($slide) {
    const slideOffsetLeft = $slide.offset().left - sliderOffsetLeft
    return (slideOffsetLeft * 100) / sliderWidth / 100
  }

  function updateSlide($slide) {
    const $headerText = $slide.find('.header .doggie-name')
    const slidePosition = getSlideRelativePosition($slide)
    const $doggieAnimationElem = $($slide[0].doggieAnimationModel.element)
    //slide out of view

    if (slidePosition >= 1 || slidePosition <= -1) return

    const absolutePosition = Math.abs(slidePosition)
    const textOpacity = 1 - (absolutePosition / 1) * 1.25

    $headerText.css('left', slidePosition * -400)
    $headerText.css('opacity', textOpacity)
    $doggieAnimationElem.css(
      'transform',
      `translate(${slidePosition * -150}px, 0)`
    )
    // $slide[0].doggieAnimationModel.translate.x = slidePosition * -100
    $slide[0].doggieAnimationModel.zoom = 3 - (absolutePosition / 1) * 2
    $slide[0].doggieAnimationModel.rotate.y = slidePosition / 1
    $slide[0].doggieAnimationModel.updateRenderGraph()
  }

  function updateSlidesPosition() {
    $slider.css('overflow', 'hidden') // to prevent the momentum scrolling on mobile
    const currentPosition = $slider.scrollLeft() / sliderWidth
    goToSlide({ index: Math.round(currentPosition) })
    setTimeout(function () {
      $slider.css('overflow', 'hidden')
    }, 10)
    needsPositionUpdate = false
  }

  function animationLoop() {
    // Set current frame values
    sliderOffsetLeft = $slider.offset().left
    sliderWidth = $slider.width()
    // Check if there was an swipe
    if (scrollLeft === $slider.scrollLeft()) {
      if (needsPositionUpdate) updateSlidesPosition()
      window.requestAnimationFrame(animationLoop)
      return
    }

    scrollLeft = $slider.scrollLeft()

    $slides.each(function () {
      updateSlide($(this))
    })

    window.requestAnimationFrame(animationLoop)
  }

  /*****************
   * EVENTS LISTENERS
   *******************/
  $slider.on('mousedown touchstart', function () {
    mousedown = true
  })

  $slider.on('mouseup touchend', function () {
    if (mousedown) {
      needsPositionUpdate = true
      mousedown = false
    }
  })

  $('#arrows #left').on('click', function () {
    goToPrevSlide()
  })

  $('#arrows #right').on('click', function () {
    goToNextSlide()
  })

  /*****************
   * SLIDES SETUP
   *******************/

  $slides[0].doggieAnimationModel = makeMarioModel({
    elem: $slides.eq(0).find('.doggie-animation')[0],
  })
  $slides[1].doggieAnimationModel = makeKirbyModel({
    elem: $slides.eq(1).find('.doggie-animation')[0],
  })
  $slides[2].doggieAnimationModel = makeMarioModel({
    elem: $slides.eq(2).find('.doggie-animation')[0],
  })

  window.requestAnimationFrame(animationLoop)
})
