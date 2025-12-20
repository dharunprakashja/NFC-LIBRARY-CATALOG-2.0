import React from "react";
import UserBooksDataGrid from "../components/UserBooksDataGrid";
import UserAppBar from "../UserAppBar";

const UserHome = () => {
  return (
    <div>
        <UserAppBar/>
      <UserBooksDataGrid />
    </div>
  );
};

export default UserHome;
