import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket, theme, mode }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    const response = await axios.post(recieveMessageRoute, {
      from: data._id,
      to: currentChat._id,
    });
    setMessages(response.data);
  }, [currentChat]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: data._id,
      msg,
    });
    await axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
    });

    const msgs = [...messages];
    msgs.push({ fromSelf: true, message: msg });
    setMessages(msgs);
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }
  }, []);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function renderImage(msg) {
    const { cv } = window;
    var fontName = "'Comic Sans MS'";
    let fontSize = 20;
    // Set gapWidth and outlineThickness as a percentage of the font size
    let gapWidth = 6.39;
    let outlineThickness = 6.39;
    let padding = 17.75;
    let removeText = false;
    let darkMode = false;
    let text = msg;
    var tCtx = document.getElementById("textCanvas").getContext("2d"); //Hidden canvas
    let blurRadius = 3;
    let borderColorHex = "#ff0000";

    tCtx.font = fontSize + "px " + fontName;
    tCtx.canvas.width = tCtx.measureText(text).width + padding * 2;
    tCtx.canvas.height = 1.25 * fontSize + 2 * padding;
    tCtx.font = fontSize + "px " + fontName;
    tCtx.fillStyle = "white";
    tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
    tCtx.fillStyle = "black";
    tCtx.fillText(text, padding, fontSize + padding / 2);
    let img = cv.imread("textCanvas");
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

    cv.imshow(msg, borderImage);
    img.delete();
    shape.delete();
    contours.delete();
    hierarchy.delete();
    contourImage.delete();
    textImage.delete();
    borderImage.delete();

    return borderImage;
  }
  useEffect(() => {
   
    messages.forEach((msg) => {
      renderImage(msg.message);
    });

    // const { cv } = window;
    // if (cv) {
    //   cv["onRuntimeInitialized"] = () => {
    //     if (contacts.length) {
    //       contacts.forEach((con) => {
    //         renderImage(con.username);
    //       });
    //     }
    //   };
    // }
  }, [messages, currentChat, arrivalMessage , mode]);

  const Container =
    theme === "dark"
      ? styled.div`
          display: grid;
          grid-template-rows: 10% 80% 10%;
          gap: 0.1rem;
          overflow: hidden;
          @media screen and (min-width: 720px) and (max-width: 1080px) {
            grid-template-rows: 15% 70% 15%;
          }
          .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
            background-color: #9e7676;
            .user-details {
              display: flex;
              align-items: center;
              gap: 1rem;
              .avatar {
                img {
                  height: 3rem;
                }
              }
              .username {
                h3 {
                  color: white;
                }
              }
            }
          }
          .chat-messages {
            padding: 1rem 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            overflow: auto;
            background-color: #fff8ea;
            overflow-x: hidden;
            &::-webkit-scrollbar {
              width: 0.2rem;
              &-thumb {
                background-color: red;
                width: 0.1rem;
                border-radius: 1rem;
              }
            }
            .message {
              display: flex;
              align-items: center;
              .content {
                max-width: 40%;
                overflow-wrap: break-word;
                padding: 10px;
                border-radius: 1rem;
                color: #d1d1d1;
                font-size:8px;
                @media screen and (min-width: 720px) and (max-width: 1080px) {
                  max-width: 70%;
                
                }
              }
            }
            .sended {
              justify-content: flex-end;
              .content {
                background-color: #4f04ff21;
              }
            }
            .recieved {
              justify-content: flex-start;
              .content {
                background-color: #9900ff20;
              }
            }
          }
        `
      : styled.div`
          display: grid;
          grid-template-rows: 10% 80% 10%;
          gap: 0.1rem;
          overflow: hidden;
          @media screen and (min-width: 720px) and (max-width: 1080px) {
            grid-template-rows: 15% 70% 15%;
          }
          .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
            background-color: #a8b375;
            .user-details {
              display: flex;
              align-items: center;
              gap: 1rem;
              .avatar {
                img {
                  height: 3rem;
                }
              }
              .username {
                h3 {
                  color: white;
                }
              }
            }
          }
          .chat-messages {
            padding: 1rem 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            overflow: auto;
            background-color: #fff8ea;
            overflow-x: hidden;
            &::-webkit-scrollbar {
              width: 0.2rem;
              &-thumb {
                background-color: red;
                width: 0.1rem;
                border-radius: 1rem;
              }
            }
            .message {
              display: flex;
              align-items: center;
              .content {
                max-width: 40%;
                overflow-wrap: break-word;
                padding: 1rem;
                font-size: 1.1rem;
                border-radius: 1rem;
                color: #d1d1d1;
                @media screen and (min-width: 720px) and (max-width: 1080px) {
                  max-width: 70%;
                }
              }
            }
            .sended {
              justify-content: flex-end;
              .content {
                background-color: #4f04ff21;
              }
            }
            .recieved {
              justify-content: flex-start;
              .content {
                background-color: #9900ff20;
              }
            }
          }
        `;

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content">
                  <canvas
                    id="textCanvas"
                    width="0"
                    height="0"
                    style={{
                      visibility: "hidden",
                    }}
                  ></canvas>
                  <canvas
                    id={message.message}
                    style={{
                      display: mode === "bubble" ? "flex" : "none",
                    }}
                  ></canvas>
                  {mode==='normal' && <h1
                    style={{
                      color:'black'
                    }}
                  >{message.message}</h1>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ChatInput handleSendMsg={handleSendMsg} 
      mode={mode}
      />
    </Container>
  );
}
