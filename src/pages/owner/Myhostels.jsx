import { useEffect, useState } from "react";
import { getMyHostels } from "../../api/hostel.api";

const MyHostels = () => {
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    getMyHostels().then((res) => setHostels(res.data));
  }, []);

  return (
    <ul>
      {hostels.map((h) => (
        <li key={h._id}>{h.name}</li>
      ))}
    </ul>
  );
};

export default MyHostels;
