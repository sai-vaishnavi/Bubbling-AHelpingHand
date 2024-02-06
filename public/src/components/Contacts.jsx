import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "../assets/logo.svg";
import Logout from "./Logout";

export default function Contacts({ contacts, changeChat, mode }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);

  useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    setCurrentUserName(data.username);
    setCurrentUserImage(data.avatarImage);
  }, []);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  function renderImage(username) {
    const { cv } = window;

    if (username.length && cv) {
      const { cv } = window;
      var fontName = "'Comic Sans MS'";
      let fontSize = 20;
      // Set gapWidth and outlineThickness as a percentage of the font size
      let gapWidth = 6.39;
      let outlineThickness = 3.39;
      let padding = 8.75;
      let removeText = false;
      let darkMode = false;
      let text = username;
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

      cv?.imshow(username, borderImage);
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
    const { cv } = window;
    if (cv) {
      cv["onRuntimeInitialized"] = () => {
        if (contacts.length) {
          contacts.forEach((con) => {
            renderImage(con.username);
          });
        }
      };
    }
  }, [contacts]);

  return (
    <>
      {currentUserImage && currentUserImage && contacts.length > 0 && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>Bubbling</h3>
          </div>
          <div className="contacts">
            {contacts.map((contact, index) => {
              return (
                <div
                  key={contact._id}
                  className={`contact ${
                    index === currentSelected ? "selected" : ""
                  }`}
                  onClick={() => changeCurrentChat(index, contact)}
                >
                  <div className="avatar">
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt=""
                    />
                  </div>
                  <div
                    className="username"
                    style={{
                      display: "flex",
                      justifyContent: "start",
                    }}
                  >
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
                      id={contact.username}
                      style={{
                        maxWidth: "max-content",
                        display: mode === "bubble" ? "flex" : "none",
                      }}
                    ></canvas>

                    {mode === "normal" && (
                      <>
                        <h1>{contact.username}</h1>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="current-user"
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div className="avatar">
                <img
                  src={`data:image/svg+xml;base64,${currentUserImage}`}
                  alt="avatar"
                />
              </div>
              <div className="username">
                <h2>{currentUserName}</h2>
              </div>
            </div>

            <Logout />
          </div>
        </Container>
      )}
    </>
  );
}
const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #daa8a8;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    font-size:10px;
    color:rgb(89, 69, 69);
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      border-radius: 20px;
      background-color: white;
      cursor: pointer;
      width: 90%;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 2rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
    .selected {
      background-color: #9e7676;
      color:white
    }
  }

  .current-user {
    background-color: #9e7676;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    height: 71px;
    margin-top: auto;
    color:white;
    .avatar {
      img {
        height: 3rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;

const Containerl = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #d6e29c;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      border-radius: 20px;
      background-color: white;
      cursor: pointer;
      width: 90%;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 2rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
    .selected {
      background-color: #788246;
    }
  }

  .current-user {
    background-color: #788246;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    height: 71px;
    margin-top: auto;
    .avatar {
      img {
        height: 3rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;
