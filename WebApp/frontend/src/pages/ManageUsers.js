import React from "react";
import MembersGrid from "../components/MembersGrid";

const styles = `
  .manage-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .manage-page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border: 1px solid #e8e8ee;
    border-radius: 18px;
    background: linear-gradient(135deg, #ffffff 0%, #f7f7fb 100%);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  }

  .manage-page-kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8a8a96;
    margin-bottom: 8px;
  }

  .manage-page-title {
    font-size: 30px;
    line-height: 1;
    margin: 0;
    color: #111;
  }

  .manage-page-subtitle {
    margin-top: 8px;
    color: #6b7280;
    font-size: 14px;
    max-width: 60ch;
  }
`;

export default function ManageUsers() {
    return (
        <>
            <style>{styles}</style>
            <div className="manage-page">
                <div className="manage-page-header">
                    <div>
                        <div className="manage-page-kicker">Library admin</div>
                        <h1 className="manage-page-title">Manage Users</h1>
                        <p className="manage-page-subtitle">View and maintain the member list from one place.</p>
                    </div>
                </div>
                <MembersGrid />
            </div>
        </>
    );
}
