import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "../styles/VideoMeet.css";
import server from "../environment";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const screenShareVideoref = useRef();
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showModal, setModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef([]);
  const [videos, setVideos] = useState([]);
  const [screenSharingUser, setScreenSharingUser] = useState(null);

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    if (!askForUsername) {
      connectToSocketServer();
    }
  }, [askForUsername]);

  useEffect(() => {
    if (screenShareVideoref.current && screenSharingUser) {
      const sharingVideo = videoRef.current.find(
        (v) => v.socketId === screenSharingUser
      );
      if (sharingVideo && sharingVideo.stream) {
        screenShareVideoref.current.srcObject = sharingVideo.stream;
      }
    } else if (screenShareVideoref.current && !screenSharingUser && !screen) {
      screenShareVideoref.current.srcObject = null;
    }
  }, [screenSharingUser, screen, videos]);

  const getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {
            if (socketRef.current) {
              socketRef.current.emit("screen-share", {
                isSharing: true,
                socketId: socketIdRef.current,
              });
            } else {
              console.warn(
                "Socket not initialized, cannot emit screen-share event"
              );
            }
          })
          .catch((e) => console.log("getDisplayMedia error:", e));
      }
    } else if (socketRef.current) {
      socketRef.current.emit("screen-share", {
        isSharing: false,
        socketId: socketIdRef.current,
      });
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log("getPermissions error:", error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);
    }
  }, [video, audio]);

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    setAskForUsername(false);
  };

  const getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log("getUserMediaSuccess error:", e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log("createOffer:", description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log("setLocalDescription error:", e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log("track.onended error:", e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log("createOffer error:", e));
            });
          }
        })
    );
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log("getUserMedia error:", e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.log("getUserMedia cleanup error:", e);
      }
    }
  };

  const getDislayMediaSuccess = (stream) => {
    console.log("getDislayMediaSuccess");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log("getDislayMediaSuccess cleanup error:", e);
    }

    window.localStream = stream;
    if (screenShareVideoref.current) {
      screenShareVideoref.current.srcObject = stream;
    }
    localVideoref.current.srcObject = null;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log("createOffer error:", e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);
          setScreenSharingUser(null);
          if (socketRef.current) {
            socketRef.current.emit("screen-share", {
              isSharing: false,
              socketId: socketIdRef.current,
            });
          }

          try {
            let tracks = screenShareVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log("track.onended error:", e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;
          screenShareVideoref.current.srcObject = null;

          getUserMedia();
        })
    );
  };

  const gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log("setLocalDescription error:", e));
                })
                .catch((e) => console.log("createAnswer error:", e));
            }
          })
          .catch((e) => console.log("setRemoteDescription error:", e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log("addIceCandidate error:", e));
      }
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("screen-share", ({ isSharing, socketId }) => {
      if (isSharing) {
        setScreenSharingUser(socketId);
      } else if (screenSharingUser === socketId) {
        setScreenSharingUser(null);
      }
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        if (screenSharingUser === id) {
          setScreenSharingUser(null);
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            console.log("onaddstream:", socketListId);
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {
              console.log("addStream error:", e);
            }

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log("createOffer error:", e));
            });
          }
        }
      });
    });
  };

  const silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const handleVideo = () => {
    setVideo(!video);
  };

  const handleAudio = () => {
    setAudio(!audio);
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  const handleScreen = () => {
    setScreen(!screen);
  };

  const handleEndCall = () => {
    try {
      let tracks = localVideoref.current?.srcObject?.getTracks() || [];
      tracks.forEach((track) => track.stop());
      let screenTracks =
        screenShareVideoref.current?.srcObject?.getTracks() || [];
      screenTracks.forEach((track) => track.stop());
    } catch (e) {
      console.log("handleEndCall error:", e);
    }
    window.location.href = "/";
  };

  const openChat = () => {
    setModal(true);
    setNewMessages(0);
  };

  const closeChat = () => {
    setModal(false);
  };

  const handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  const sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const connect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setAskForUsername(false);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="video-meet-container">
      {askForUsername ? (
        <div className="lobby-container">
          {isLoading && <div className="video-meet-loader"></div>}
          <h2>Enter into Lobby</h2>
          <div className="lobby-input-wrapper">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Username"
              disabled={isLoading}
            />
          </div>
          <button
            className="connect-button"
            onClick={connect}
            disabled={isLoading}
          >
            Connect
          </button>
          <div className="local-video-container">
            <video ref={localVideoref} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div
          className={`meet-video-container ${
            screen || screenSharingUser ? "screen-sharing" : ""
          }`}
        >
          {showModal && (
            <div className="chat-room">
              <div className="chat-container">
                <h1>Chat</h1>
                <div className="chatting-display">
                  {messages.length !== 0 ? (
                    messages.map((item, index) => (
                      <div className="chat-message" key={index}>
                        <p className="chat-sender">{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>
                <div className="chatting-area">
                  <div className="chat-input-wrapper">
                    <label htmlFor="chat-message">Enter Your Chat</label>
                    <input
                      id="chat-message"
                      type="text"
                      value={message}
                      onChange={handleMessage}
                      placeholder="Type your message"
                    />
                  </div>
                  <button className="send-button" onClick={sendMessage}>
                    Send
                  </button>
                  <button className="close-chat-button" onClick={closeChat}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="button-container">
            <button className="control-button" onClick={handleVideo}>
              {video ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11zM15 15H5V9h10v6z" />
                </svg>
              )}
            </button>
            <button className="control-button end-call" onClick={handleEndCall}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 9c-1.6 0-3.15.59-4.35 1.66l1.42 1.42C10.02 11.36 11.01 11 12 11s1.98.36 2.93 1.08l1.42-1.42C15.15 9.59 13.6 9 12 9zm6.35 4.24C16.14 11.86 14.14 11 12 11s-4.14.86-6.35 2.24l1.42 1.42C8.86 13.36 10.36 13 12 13s3.14.36 4.93 1.66l1.42-1.42z" />
              </svg>
            </button>
            <button className="control-button" onClick={handleAudio}>
              {audio ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6.91 6c-.49 0-.9.36-.98.85C16.48 14.2 14.38 16 12 16s-4.48-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 2.84 2.76 5.01 5.93 5.01s5.44-2.17 5.93-5.01c.09-.60-.39-1.14-1-1.14z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6.91 6c-.49 0-.9.36-.98.85C16.48 14.2 14.38 16 12 16s-4.48-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 2.84 2.76 5.01 5.93 5.01s5.44-2.17 5.93-5.01c.09-.60-.39-1.14-1-1.14zM3 3l18 18" />
                </svg>
              )}
            </button>
            {screenAvailable && (
              <button className="control-button" onClick={handleScreen}>
                {screen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12zM7 12l5-5 5 5H7z" />
                  </svg>
                )}
              </button>
            )}
            <div className="chat-badge">
              <span className="badge-content">{newMessages}</span>
              <button
                className="control-button"
                onClick={() => setModal(!showModal)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zM6 8h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="main-content">
            {(screen || screenSharingUser) && (
              <div className="shared-screen">
                <video
                  className="screen-video"
                  ref={screenShareVideoref}
                  autoPlay
                  muted={screen}
                ></video>
              </div>
            )}
            <div
              className={`video-strip ${
                screen || screenSharingUser ? "active" : ""
              }`}
            >
              <div className="video-wrapper local-video">
                <video
                  ref={localVideoref}
                  autoPlay
                  muted
                  className="meet-user-video"
                ></video>
              </div>
              {videos
                .filter((video) => video.socketId !== screenSharingUser)
                .map((video) => (
                  <div key={video.socketId} className="video-wrapper">
                    <video
                      data-socket={video.socketId}
                      ref={(ref) => {
                        if (ref && video.stream) {
                          ref.srcObject = video.stream;
                        }
                      }}
                      autoPlay
                      playsInline
                    ></video>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
