import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import ChatInput from "../components/ChatInput";

export default function Chat() {
  const [mode, setMode] = useState("normal");
  const [theme, setTheme] = useState("dark");
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  useEffect(async () => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/login");
    } else {
      setCurrentUser(
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )
      );
    }
  }, []);
  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  useEffect(async () => {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
        setContacts(data.data);
      } else {
        navigate("/setAvatar");
      }
    }
  }, [currentUser]);
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };
  return (
    <div
      style={{
        backgroundColor: "#594545",
        padding: 10,
        height: "100vh",
        paddingRight: 115,
        paddingTop: 50,
      }}
    >
      <div
        style={{
          display:'flex',
          gap:10,
          justifyContent:'end',
          marginTop:'-40px'
        }}
      >
        <h1
          style={{
            color: "white",
            padding: '5px',
            fontSize:'20px',
            paddingTop:'12px',
            margin:'revert'
          }}
        >
          Bubble
        </h1>
        <h1 id="off"
          onClick={() => setMode("normal")}
          style={{
            color: "rgb(89 69 69)",
            cursor:'pointer',
            border: '2px solid black',
            background: "#fff8ea",
            borderRadius: '6px',
            padding: '5px',
            fontSize:'20px',
            paddingTop:'12px',
            margin:'revert'
          }}
        >
          OFF
        </h1>
        <h1 id="on"
          onClick={() => setMode("bubble")}
          style={{
            color: "rgb(89 69 69)",
            cursor: 'pointer',
            border: '2px solid black',
            background: "#fff8ea",
            borderRadius: '6px',
            padding: '5px',
            fontSize:'20px',
            paddingTop:'12px',
            margin:'revert'
          }}
        >
          ON
        </h1>
      </div>
      <Container>
        <div className="container">
          <Contacts
            contacts={contacts}
            changeChat={handleChatChange}
            theme={theme}
            mode={mode}
          />
          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer
              currentChat={currentChat}
              socket={socket}
              theme={theme}
              mode={mode}
            />
          )}
        </div>
      </Container>
    </div>
  );
}

const Container = styled.div`
  height: 85vh;
  margin-top: 20;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  .container {
    height: 85vh;
    width: 85vw;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
