"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const maskedImage = document.getElementById("maskedImage");
  let resultImage = document.getElementById("resultImage");
  const aspect169 = document.getElementById("aspect169");
  const aspect11 = document.getElementById("aspect11");
  const aspect23 = document.getElementById("aspect23");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const expandImageButton = document.getElementById("expandImageButton");

  let uploadedImage = null;
  let uploadedImageFile = null;
  let maskedDataURL = null;
  let maskFile = null;
  let aspectRatio = 16 / 9; // Default aspect ratio

  // Handle image upload
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadedImage = new Image();
        uploadedImage.src = e.target.result;
        uploadedImage.onload = function () {
          drawCanvas();
        };
      };
      reader.readAsDataURL(file);
    }
  });

  expandImageButton.addEventListener("click", function () {
    console.log("hello");
    expandImage();
  });

  // Handle aspect ratio buttons
  aspect169.addEventListener("click", function () {
    aspectRatio = 16 / 9;
    drawCanvas();
  });

  aspect11.addEventListener("click", function () {
    aspectRatio = 1;
    drawCanvas();
  });

  aspect23.addEventListener("click", function () {
    aspectRatio = 2 / 3;
    drawCanvas();
  });

  // Draw the canvas with overlay and mask
  function drawCanvas() {
    if (!uploadedImage) return;

    const canvasWidth = (canvas.width = 400); // Set your desired canvas width
    const canvasHeight = canvasWidth / aspectRatio;

    // Calculate dimensions to preserve the image aspect ratio within the canvas
    let imageWidth, imageHeight;
    if (uploadedImage.width / uploadedImage.height > aspectRatio) {
      imageWidth = canvasWidth;
      imageHeight = canvasWidth / (uploadedImage.width / uploadedImage.height);
    } else {
      imageHeight = canvasHeight;
      imageWidth = canvasHeight * (uploadedImage.width / uploadedImage.height);
    }

    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw uploaded image
    ctx.drawImage(
      uploadedImage,
      (canvasWidth - imageWidth) / 2,
      (canvasHeight - imageHeight) / 2,
      imageWidth,
      imageHeight
    );

    // Create a transparent mask by setting transparent pixels in the areas not covered by the image
    const maskData = ctx.createImageData(canvas.width, canvas.height);

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
    const maskCtx = maskCanvas.getContext("2d");
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
