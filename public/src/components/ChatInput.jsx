import React, { useEffect, useState } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import styled from "styled-components";
import Picker from "emoji-picker-react";

export default function ChatInput({ handleSendMsg, mode }) {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const handleEmojiPickerhideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (event, emojiObject) => {
    let message = msg;
    message += emojiObject.emoji;
    setMsg(message);
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.length > 0) {
      handleSendMsg(msg);
      setMsg("");
    }
  };

  function renderImage() {
    const { cv } = window;

    if (msg.length && cv) {
      const { cv } = window;
      var fontName = "'Comic Sans MS'";
      let fontSize = 30;
      // Set gapWidth and outlineThickness as a percentage of the font size
      let gapWidth = 6.39;
      let outlineThickness = 3.39;
      let padding = 8.75;
      let removeText = false;
      let darkMode = false;
      let text = msg;
      var tCtx = document.getElementById("textCanvas").getContext("2d"); //Hidden canvas
      let blurRadius = 3;
      let borderColorHex = "#ff0000";

      tCtx.font = fontSize + "px " + fontName;
      tCtx.canvas.width = tCtx.measureText(text).width + padding * 2;
      tCtx.canvas.height = 1 * fontSize + 2 * padding;
      tCtx.font = fontSize + "px " + fontName;
      tCtx.fillStyle = "white";
      tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
      tCtx.fillStyle = "black";
      tCtx.fillText(text, padding, fontSize + padding / 2);
      let img = cv?.imread("textCanvas");
      let shape = cv?.Mat.zeros(img.cols, img.rows, cv?.CV_8UC1);
      cv?.cvtColor(img, shape, cv?.COLOR_RGBA2GRAY, 0);
      cv?.bitwise_not(shape, shape);

      // Make white image for border
      let borderImage = cv?.Mat.zeros(img.rows, img.cols, cv?.CV_8UC3);
      cv?.bitwise_not(borderImage, borderImage);

      // Make non-transparent image for text
      let textImage = cv?.Mat.zeros(img.rows, img.cols, cv?.CV_8UC3);
      cv?.cvtColor(img, textImage, cv?.COLOR_RGBA2RGB, 0);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      let contourImage = cv?.Mat.zeros(img.rows, img.cols, cv?.CV_8UC3);

      // Find and draw contours
      // RETR_EXTERNAL means it will fill in holes in letters like 'o' and 'a'
      // Draw thickly enough that the outside edge will be the center of the outline
      cv?.findContours(
        shape,
        contours,
        hierarchy,
        cv?.RETR_EXTERNAL,
        cv?.CHAIN_APPROX_SIMPLE
      );
      let color = null;
      let r = parseInt(borderColorHex.substring(1, 3), 16);
      let g = parseInt(borderColorHex.substring(3, 5), 16);
      let b = parseInt(borderColorHex.substring(5, 7), 16);
      if (darkMode) {
        // Invert the color for dark mode because it will get inverted back later
        // Doing it this way ensures the blurring will use the right background color
        color = new cv.Scalar(255 - r, 255 - g, 255 - b);
      } else {
        color = new cv.Scalar(r, g, b);
      }
      cv?.drawContours(
        contourImage,
        contours,
        -1,
        color,
        gapWidth + outlineThickness
      );

      // Flatten contour image into a grayscale image and make it white-on-black also
      cv?.cvtColor(contourImage, shape, cv?.COLOR_BGR2GRAY);
      cv?.threshold(shape, shape, 0, 255, cv?.THRESH_BINARY);

      // Find the outside edge of the countour we just drew
      // This will be the center of the outline
      cv?.findContours(
        shape,
        contours,
        hierarchy,
        cv?.RETR_EXTERNAL,
        cv?.CHAIN_APPROX_SIMPLE
      );

      // Add outline to original image
      cv?.drawContours(borderImage, contours, -1, color, outlineThickness);

      // Blur the border image to make it look less pixelated
      cv?.GaussianBlur(
        borderImage,
        borderImage,
        new cv.Size(blurRadius, blurRadius),
        0,
        0,
        cv?.BORDER_DEFAULT
      );

      if (!removeText) {
        // Combine the text and the border
        cv?.bitwise_and(borderImage, textImage, borderImage);
      }
      if (darkMode) {
        cv?.bitwise_not(borderImage, borderImage);
      }

      cv?.imshow(msg, borderImage);
      img.delete();
      shape.delete();
      contours.delete();
      hierarchy.delete();
      contourImage.delete();
      textImage.delete();
      borderImage.delete();

      return borderImage;
    }
  }

  useEffect(() => {
    if(msg)
    {
      renderImage();
    }
  }, [msg]);

  return (
    <Container>
      <div className="button-container">
        <div className="emoji">
          <BsEmojiSmileFill onClick={handleEmojiPickerhideShow} />
          {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} />}
        </div>
      </div>
      <form
        className="input-container"
        onSubmit={(event) => sendChat(event)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "start",
          }}
        >
          {msg  && (
            <div>
              <canvas
                id="textCanvas"
                width="0"
                height="0"
                style={{
                  visibility: "hidden",
                  width: 0,
                }}
              ></canvas>
              <canvas
                id={msg}
                style={{
                  padding: "5px 0px 0px 0px",
                  maxWidth: "max-content",
                  display : mode === 'normal' ? 'none' : 'flex'
                }}
              ></canvas>
            </div>
          )}
          {mode === "bubble" && (
            <input
              type="text"
              onChange={(e) => {
                setMsg(e.target.value);
              }}
              value={msg}
              style={{
                color: "transparent",
                cursor: "text",
                height: "80px",
                position: "absolute",
              }}
            />
          )}

          {mode === "normal" && (
            <input
              type="text"
              onChange={(e) => {
                setMsg(e.target.value);
              }}
              value={msg}
              style={{
                  fontSize:20,
                  width:'100%'
              }}
            />
          )}
        </div>
        <button type="submit">
          <IoMdSend />
        </button>
      </form>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 5% 95%;
  background-color: #daa8a8;
  padding: 0 2rem;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0 1rem;
    gap: 1rem;
  }
  .button-container {
    display: flex;
    align-items: center;
    color: white;
    gap: 1rem;
    .emoji {
      position: relative;
      svg {
        font-size: 1.5rem;
        color: #ffff00c8;
        cursor: pointer;
      }
      .emoji-picker-react {
        position: absolute;
        top: -350px;
        background-color: #080420;
        box-shadow: 0 5px 10px #9a86f3;
        border-color: #9a86f3;
        .emoji-scroll-wrapper::-webkit-scrollbar {
          background-color: #080420;
          width: 5px;
          &-thumb {
            background-color: #9a86f3;
          }
        }
        .emoji-categories {
          button {
            filter: contrast(0);
          }
        }
        .emoji-search {
          background-color: transparent;
          border-color: #9a86f3;
        }
        .emoji-group:before {
          background-color: #080420;
        }
      }
    }
  }
  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 5px;
    background-color: #ffffff34;
    input {
      width: 40%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 0.5rem;

      &::selection {
        background-color: #9a86f3;
      }
      &:focus {
        outline: none;
      }
    }
    button {
      padding: 0.3rem 2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #9e7676;
      border: none;
      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.3rem 1rem;
        svg {
          font-size: 1rem;
        }
      }
      svg {
        font-size: 2rem;
        color: white;
      }
    }
  }
`;

const Containerl = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 5% 95%;
  background-color: #a8b375;
  padding: 0 2rem;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0 1rem;
    gap: 1rem;
  }
  .button-container {
    display: flex;
    align-items: center;
    color: white;
    gap: 1rem;
    .emoji {
      position: relative;
      svg {
        font-size: 1.5rem;
        color: #ffff00c8;
        cursor: pointer;
      }
      .emoji-picker-react {
        position: absolute;
        top: -350px;
        background-color: #080420;
        box-shadow: 0 5px 10px #9a86f3;
        border-color: #9a86f3;
        .emoji-scroll-wrapper::-webkit-scrollbar {
          background-color: #080420;
          width: 5px;
          &-thumb {
            background-color: #9a86f3;
          }
        }
        .emoji-categories {
          button {
            filter: contrast(0);
          }
        }
        .emoji-search {
          background-color: transparent;
          border-color: #9a86f3;
        }
        .emoji-group:before {
          background-color: #080420;
        }
      }
    }
  }
  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 5px;
    background-color: #ffffff34;
    input {
      width: 90%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 0.5rem;

      &::selection {
        background-color: #9a86f3;
      }
      &:focus {
        outline: none;
      }
    }
    button {
      padding: 0.3rem 2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #7a8642;
      border: none;
      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.3rem 1rem;
        svg {
          font-size: 1rem;
        }
      }
      svg {
        font-size: 2rem;
        color: white;
      }
    }
  }
`;
