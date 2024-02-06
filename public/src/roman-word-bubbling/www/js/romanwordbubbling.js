/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const DEBUG = false;
var fontName = "apompadour_custom";

document.getElementById("textInput").addEventListener(
  "keyup",
  function() {
    renderImage();
  },
  false
);

let feedbackDialogue;

function initializeSettings() {
  const mobile = window.outerWidth < 500 ? true : false;

  if (typeof mdc == "undefined") {
    document.body.innerHTML = "Error: could not load interface compoments<br>" + 
      "Please let us know about this error by emailing us at romanwordbubbling at gmail<br>" +
      "In the meantime, you can use our <a href='https://roman-word-bubbling-stable.appspot.com'>alternate version with a simplified interface</a>";
    return;
  }

  // dialogs
  const infoDialog = new mdc.dialog.MDCDialog(
    document.getElementById("info-dialog")
  );
  document.getElementsByClassName("info")[0].addEventListener("click", () => {
    infoDialog.open();
  });
  const helpDialog = new mdc.dialog.MDCDialog(
    document.getElementById("help-dialog")
  );
  document.getElementsByClassName("help")[0].addEventListener("click", () => {
    helpDialog.open();
  });
  feedbackDialog = new mdc.dialog.MDCDialog(
    document.getElementById("feedback-dialog")
  );
  document
    .getElementsByClassName("feedback")[0]
    .addEventListener("click", () => {
      feedbackDialog.open();
    });

  //sliders
  const sliders = document.querySelectorAll(".slider-container");
  for (const slider of sliders) {
    const sliderElement = slider.getElementsByClassName("mdc-slider")[0];
    const sliderManualInput = slider.getElementsByClassName(
      "slider-manual-input"
    )[0];
    sliderManualInput.value = sliderElement.dataset.value;
    const mdcSlider = new mdc.slider.MDCSlider(sliderElement);
    mdcSlider.listen("MDCSlider:input", () => {
      sliderElement.dataset.value = mdcSlider.value;
      sliderManualInput.value = Math.floor(mdcSlider.value);
      renderImage();
    });
    sliderManualInput.addEventListener("change", () => {
      sliderElement.dataset.value = sliderManualInput.value;
      mdcSlider.value = sliderManualInput.value;
      renderImage();
    });
  }

  // colors
  const colorOptions = document.querySelectorAll(".color");
  for (const colorChoice of colorOptions) {
    colorChoice.addEventListener("click", e => {
      for (const color of colorOptions) {
        color.classList.remove("selected");
      }
      e.target.classList.add("selected");
      renderImage();
    });
  }

  // drawer controls
  const drawer = document.getElementsByClassName("mdc-drawer__container")[0];
  const controls = document.getElementsByClassName("controls")[0];
  const close = drawer.getElementsByClassName("close")[0];
  const edit = document.getElementsByClassName("edit")[0];
  close.addEventListener("click", () => {
    drawer.classList.add("collapsed");
    controls.classList.add("collapsed");
    renderImage();
  });
  edit.addEventListener("click", () => {
    drawer.classList.remove("collapsed");
    controls.classList.remove("collapsed");
    renderImage();
  });

  // More fonts
  addFontIfAvailable("Trebuchet", "'Trebuchet MS'");
  addFontIfAvailable("Comic Sans", "'Comic Sans Ms'");
}

function addFontIfAvailable(fontText, fontValue) {
  var fontDetector = new Detector();
  if (fontDetector.detect(fontValue)) {
    const fontChooser = document.getElementById("fontChooser");
    var option = document.createElement("option")
    option.text = fontText;
    option.value = fontValue;
    fontChooser.add(option, fontChooser.length - 1);
  }

}

function updateFont() {
  fileButton = document.getElementById("fontFile");
  selectedFont = document.getElementById("fontChooser").value;
  if (selectedFont === "custom") {
    fileButton.hidden = false;
  } else {
    // Hide the file picker if it isn't already.
    // Also clear it so the onchange event will fire again
    if (fileButton.hidden == false) {
      fileButton.hidden = true;
      fileButton.value = "";
    }
    fontName = selectedFont;
  }
  renderImage();
}

// Returns the colors in an array in ["r", "g", "b"] format
function getColor() {
  const colorNode = document.getElementsByClassName("selected")[0];
  rgbString = colorNode.style.backgroundColor;
  return rgbString
    .substr(4, rgbString.length - 5)
    .replace(" ", "")
    .split(",");
}

function loadCustomFont() {
  file = document.getElementById("fontFile").files[0];
  if (file) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var customFont = new FontFace("userFont", event.target.result);
      customFont.load().then(function(loadedFont) {
        document.fonts.add(loadedFont);
        fontName = "userFont";
        renderImage();
      });
    };
    reader.readAsArrayBuffer(file);
  }
}
function renderImage() {
  let fontSize = parseInt(
    document.getElementById("fontSize").dataset.value,
    10
  );
  // Set gapWidth and outlineThickness as a percentage of the font size
  let gapWidth =
    (fontSize *
      parseInt(document.getElementById("gapWidth").dataset.value, 10)) /
    100;
  let outlineThickness =
    (fontSize *
      parseInt(document.getElementById("outlineThickness").dataset.value, 10)) /
    100;
  let padding = gapWidth + outlineThickness;
  let removeText = document.getElementById("removeText").checked;
  let darkMode = document.getElementById("darkMode").checked;
  let text = document.getElementById("textInput").value;
  var tCtx = document.getElementById("textCanvas").getContext("2d"); //Hidden canvas
  let blurRadius = 3;

  let borderColorRgb = getColor();
  let color = null;
  r = parseInt(borderColorRgb[0], 10);
  g = parseInt(borderColorRgb[1], 10);
  b = parseInt(borderColorRgb[2], 10);

  if (darkMode) {
    document.body.style.backgroundColor = "black";
    // Invert the color for dark mode because it will get inverted back later
    // Doing it this way ensures the blurring will use the right background color
    color = new cv.Scalar(255 - r, 255 - g, 255 - b);
  } else {
    document.body.style.backgroundColor = "transparent";
    color = new cv.Scalar(r, g, b);
  }

  tCtx.font = fontSize + "px " + fontName; // Has to be set every time
  var spaceWidth = tCtx.measureText(" ").width;
  var lineHeight = 1.25 * fontSize + padding; // TODO: padding*2

  var lines = text.split('\n');
  var lineCount = 0;
  var maxLineWidth = 0;
  var images = [];
  for (var i = 0; i < lines.length; i++) {
    images[lineCount] = [];
    var words = lines[i].split(" ");
    var x = -spaceWidth; // So we don't need an if at the start of the loop
    var wordCount = 0;
    for (var j = 0; j < words.length; j++) {
      x = x + spaceWidth;
      var word = words[j];
      if (word === "") {
        continue;
      }
      // TODO: Check for special characters before measuring
      tCtx.font = fontSize + "px " + fontName; // Has to be set every time
      var wordWidth = tCtx.measureText(word).width;
      // If this isn't the first word and it overruns the line, start a new line
      const drawer = document.getElementsByClassName("mdc-drawer__container")[0];
      var drawerWidth = 256;
      if(drawer.classList.contains("collapsed")) {
        drawerWidth = 0;
      }
      if (x + wordWidth > window.innerWidth - drawerWidth && wordCount > 0) {
        // TODO: A lot of this is duplicated code, clean it up
        var lineWidth = x + padding;
        if (lineWidth > maxLineWidth) {
          maxLineWidth = lineWidth;
        }
        wordCount = 0;
        x = 0;
        lineCount++;
        images[lineCount] = [];
      }
      tCtx.canvas.height = lineHeight + padding*2;
      tCtx.canvas.width = wordWidth + padding*2;

      tCtx.fillStyle = "white";
      tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
      tCtx.font = fontSize + "px " + fontName; // Has to be set every time
      tCtx.fillStyle = "black";
      tCtx.fillText(word, padding, fontSize + padding);
    
      let img = cv.imread("test");
      let borderImage = bubbleWord(img, color, removeText, darkMode, gapWidth, outlineThickness, blurRadius);

      images[lineCount][wordCount] = [borderImage, new cv.Rect(x, lineHeight*lineCount, tCtx.canvas.width, tCtx.canvas.height)];

      x = x + wordWidth;
      wordCount++;
    }
    var lineWidth = x + padding;
    if (lineWidth > maxLineWidth) {
      maxLineWidth = lineWidth;
    }
    lineCount++;
  }
  // Reset
  tCtx.canvas.height = lineCount * lineHeight + padding*2; // extra padding for top/bottom (no overlap)
  tCtx.canvas.width = maxLineWidth + padding;
  // Clear
  let finalImage = cv.Mat.zeros(tCtx.canvas.height, tCtx.canvas.width, cv.CV_8UC3);
  if (!darkMode) {
    cv.bitwise_not(finalImage, finalImage);
  }

  for (var i = 0; i < images.length; i++) {
    for (var j = 0; j < images[i].length; j++) {
      var image = images[i][j][0];
      cv.imshow("textCanvas", image);
      outputImage = document.getElementById("output");
      outputImage.src = document.getElementById("textCanvas").toDataURL();
      var rect = images[i][j][1];
      let dest = finalImage.roi(rect);
      if(darkMode) {
        cv.bitwise_or(dest, image, dest);
      } else {
        cv.bitwise_and(dest, image, dest);
      }
      image.delete();
    }
  }
  debugOutline(finalImage, new cv.Scalar(255, 0, 0));

  cv.imshow("textCanvas", finalImage);
  outputImage = document.getElementById("output");
  outputImage.src = document.getElementById("textCanvas").toDataURL();
  finalImage.delete();
}

function bubbleWord(img, color, removeText, darkMode, gapWidth, outlineThickness, blurRadius) {
  let shape = cv.Mat.zeros(img.cols, img.rows, cv.CV_8UC1);
  cv.cvtColor(img, shape, cv.COLOR_RGBA2GRAY, 0);
  cv.bitwise_not(shape, shape);

  // Make white image for border
  let borderImage = cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC3);
  cv.bitwise_not(borderImage, borderImage);

  // Make non-transparent image for text
  let textImage = cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC3);
  cv.cvtColor(img, textImage, cv.COLOR_RGBA2RGB, 0);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let contourImage = cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC3);

  // Find and draw contours
  // RETR_EXTERNAL means it will fill in holes in letters like 'o' and 'a'
  // Draw thickly enough that the outside edge will be the center of the outline
  cv.findContours(
    shape,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  cv.drawContours(
    contourImage,
    contours,
    -1,
    color,
    gapWidth + outlineThickness
  );

  // Flatten contour image into a grayscale image and make it white-on-black also
  cv.cvtColor(contourImage, shape, cv.COLOR_BGR2GRAY);
  cv.threshold(shape, shape, 0, 255, cv.THRESH_BINARY);

  // Find the outside edge of the countour we just drew
  // This will be the center of the outline
  cv.findContours(
    shape,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  // Add outline to original image
  cv.drawContours(borderImage, contours, -1, color, outlineThickness);

  // Blur the border image to make it look less pixelated
  cv.GaussianBlur(
    borderImage,
    borderImage,
    new cv.Size(blurRadius, blurRadius),
    0,
    0,
    cv.BORDER_DEFAULT
  );

  if (!removeText) {
    // Combine the text and the border
    cv.bitwise_and(borderImage, textImage, borderImage);
  }
  if (darkMode) {
    cv.bitwise_not(borderImage, borderImage);
  }

  img.delete();
  shape.delete();
  contours.delete();
  hierarchy.delete();
  contourImage.delete();
  textImage.delete();

  debugOutline(borderImage, new cv.Scalar(0, 0, 255));

  return borderImage;
}

function debugOutline(img, color) {
  if(DEBUG) {
    cv.rectangle(img, new cv.Point(0,0), new cv.Point(img.size().width-1, img.size().height-1), color);
  }
}

function submitFeedback() {
  const description = document.getElementById("feedbackDescription").value;
  data = {
    title: document.getElementById("feedbackTitle").value,
    email: document.getElementById("feedbackEmail").value,
    description
  };
  console.log(description);
  if (description) {
    feedbackDialog.close();
    const snackbar = document.getElementsByClassName("feedback-snackbar")[0];
    snackbar.style.bottom = 10;
    document
      .getElementsByClassName("feedback-snackbar-close")[0]
      .addEventListener("click", () => {
        snackbar.style.bottom = -100;
      });
    setTimeout(() => {
      snackbar.style.bottom = -100;
    }, 5000);
    var req = new XMLHttpRequest();
    req.open("POST", "/dG9tbXltYWx2ZWVrYXJ3Yg.html", true);
    req.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    console.log("Submitting Feedback %s", JSON.stringify(data));
    req.send(JSON.stringify(data));
  } else {
    document
      .getElementsByClassName("feedback-error")[0]
      .classList.remove("hidden");
  }
}

function finalize() {
  document.getElementsByClassName("loader")[0].remove();
  document.getElementById("loadingBackground").remove();
  renderImage();
}

window.onload = initializeSettings();
document.onload = finalize();
