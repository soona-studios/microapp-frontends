"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const maskedImage = document.getElementById("maskedImage");
  let resultImage = document.getElementById("resultImage");
  const aspect169 = document.getElementById("aspect169");
  const aspect11 = document.getElementById("aspect11");
  const aspect23 = document.getElementById("aspect23");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const expandImageButton = document.getElementById("expandImageButton");
  const scaleSlider = document.getElementById("scaleSlider");

  let uploadedImage = null;
  let uploadedImageFile = null;
  let maskedDataURL = null;
  let maskFile = null;
  let aspectRatio = 16 / 9; // Default aspect ratio

  const canvasContainer = document.getElementById("canvasContainer"); // Add a container for the canvas in your HTML
  let scaleFactor = 1;

  // Function to update canvas size according to the aspect ratio
  function updateCanvasSize() {
    // Update canvas width based on the container's width and the aspect ratio
    // This assumes the container's width is the full width you want the canvas to scale to
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetWidth / aspectRatio;
    drawCanvas(); // Redraw the canvas with new dimensions
  }

  // Initial canvas size update
  updateCanvasSize();

  // Handle image upload
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadedImage = new Image();
        uploadedImage.src = e.target.result;
        uploadedImage.onload = function () {
          console.log("Uploaded image width:", uploadedImage.width);
          console.log("Uploaded image height:", uploadedImage.height);

          // Set the slider value to 1 (middle of the range) upon initial upload
          scaleSlider.value = 1;
          drawCanvas();
        };
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle aspect ratio buttons
  aspect169.addEventListener("click", function () {
    aspectRatio = 16 / 9;
    updateCanvasSize();
  });

  aspect11.addEventListener("click", function () {
    aspectRatio = 1;
    updateCanvasSize();
  });

  aspect23.addEventListener("click", function () {
    aspectRatio = 2 / 3;
    updateCanvasSize();
  });

  scaleSlider.addEventListener("input", function () {
    // Limit the scale factor to ensure the image does not exceed canvas boundaries
    const maxScaleFactor = calculateMaxScaleFactor();
    scaleFactor = Math.min(maxScaleFactor, parseFloat(scaleSlider.value));

    console.log("Scale factor:", scaleFactor);
    console.log("Max scale factor:", maxScaleFactor);

    drawCanvas(); // Redraw the canvas with the new scale factor
  });

  function calculateMaxScaleFactor() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const maxHorizontalScale = canvasWidth / uploadedImage.width;
    const maxVerticalScale = canvasHeight / uploadedImage.height;

    // Take the minimum of the horizontal and vertical scales
    return Math.min(maxHorizontalScale, maxVerticalScale);
  }

  expandImageButton.addEventListener("click", function () {
    console.log("hello");
    expandImage();
  });

  // Draw the canvas with overlay and mask
  function drawCanvas() {
    if (!uploadedImage) {
      // Handle case where no image is uploaded
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFF"; // Or any other background color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate dimensions to preserve the image aspect ratio within the canvas
    let imageWidth, imageHeight;

    // Calculate the scaled dimensions based on the slider value
    // Calculate the scaled dimensions based on the slider value
    const scaledWidth = uploadedImage.width * scaleFactor;
    const scaledHeight = uploadedImage.height * scaleFactor;

    // Calculate the dimensions that fit within the canvas
    if (scaledWidth > canvasWidth || scaledHeight > canvasHeight) {
      aspectRatio = uploadedImage.width / uploadedImage.height;

      if (scaledWidth / scaledHeight > aspectRatio) {
        // The scaled image is wider than the canvas
        imageWidth = canvasWidth;
        imageHeight = canvasWidth / aspectRatio;
      } else {
        // The scaled image is taller than the canvas
        imageHeight = canvasHeight;
        imageWidth = canvasHeight * aspectRatio;
      }

      // Scale the uploaded image to fit within the canvas dimensions
      uploadedImage.width = imageWidth;
      uploadedImage.height = imageHeight;
    } else {
      // The scaled image fits within the canvas
      imageWidth = scaledWidth;
      imageHeight = scaledHeight;
    }

    // Center the image in the canvas
    const x = (canvasWidth - imageWidth) / 2;
    const y = (canvasHeight - imageHeight) / 2;

    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw uploaded image with the calculated dimensions and position
    ctx.drawImage(uploadedImage, x, y, imageWidth, imageHeight);

    // Create a transparent mask by setting transparent pixels in the areas not covered by the image
    const maskData = ctx.createImageData(canvas.width, canvas.height);

    // set willReadFrequently to true to improve performance
    const uploadedImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Loop through the image data
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4; // 4 channels (R, G, B, A) per pixel

        // Check if the pixel is part of the uploaded image (non-transparent)
        const isUploadedImagePixel =
          uploadedImageData.data[pixelIndex + 3] !== 0;

        if (isUploadedImagePixel) {
          // Set the interior (where the image sits) to black
          maskData.data[pixelIndex] = 0; // Red channel
          maskData.data[pixelIndex + 1] = 0; // Green channel
          maskData.data[pixelIndex + 2] = 0; // Blue channel
          maskData.data[pixelIndex + 3] = 255; // Alpha channel (fully opaque)
        } else {
          // Set the edges to white
          maskData.data[pixelIndex] = 255; // Red channel
          maskData.data[pixelIndex + 1] = 255; // Green channel
          maskData.data[pixelIndex + 2] = 255; // Blue channel
          maskData.data[pixelIndex + 3] = 255; // Alpha channel (fully opaque)
        }
      }
    }

    createMaskImage(maskData);
  }

  function createMaskImage(maskData) {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    maskCtx.putImageData(maskData, 0, 0);

    // Convert the mask canvas to a Data URL
    maskedDataURL = maskCanvas.toDataURL("image/png"); // Specify the desired image format

    // add url to maskedImage element
    maskedImage.src = maskedDataURL;

    // display maskedImage
    maskedImage.style.display = "block";

    createBlobs(maskedDataURL);
  }

  function createBlobs(maskedDataURL) {
    // Create Blobs for the uploaded image and the mask
    const uploadedImageBlob = dataURLtoBlob(uploadedImage.src);
    const maskBlob = dataURLtoBlob(maskedDataURL);

    // Create a File object for the uploaded image and the mask
    uploadedImageFile = new File([uploadedImageBlob], "uploaded_image.png", {
      type: "image/png",
    });
    maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
  }

  // Helper function to convert Data URL to Blob
  function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  function expandImage() {
    const payload = {
      image: uploadedImage.src,
      mask: maskedDataURL,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    const options = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    };

    fetch("http://localhost:8000/api/v1/predictions/", options)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        resultImage.src = data[0];
      });
  }
});
