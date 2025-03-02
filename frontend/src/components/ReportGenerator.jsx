import { useState } from "react";
import axios from "axios";

const ReportGenerator = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerateReport = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/reports/generate",
        { userId: "USER_ID", startDate, endDate },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Expense_Report.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  return (
    <div>
      <h2>Generate Expense Report</h2>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      <button onClick={handleGenerateReport}>Download Report</button>
    </div>
  );
};

export default ReportGenerator;
