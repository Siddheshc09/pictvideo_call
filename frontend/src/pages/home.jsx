import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="home-container">
      <div className="navBar">
        <div className="nav-left">
          <h2>PICT Video Call</h2>
        </div>
        <div className="nav-right">
          <button
            className="history-button"
            onClick={() => navigate("/history")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.2 3.2 1-1.73-4.2-2.57V7z" />
            </svg>
            <span>History</span>
          </button>
          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2>Providing Quality Video Call Just Like Quality Education</h2>
            <div className="input-group">
              <div className="input-wrapper">
                <label htmlFor="meetingCode">Meeting Code</label>
                <input
                  id="meetingCode"
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter Meeting Code"
                />
              </div>
              <button className="join-button" onClick={handleJoinVideoCall}>
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img src="/logo3.png" alt="PICT Video Call Logo" />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
