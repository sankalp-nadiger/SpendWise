import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as d3 from "d3";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [usageType, setUsageType] = useState("personal"); // default to personal
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef();

  // Read usageType from localStorage on mount
  useEffect(() => {
    const storedUsageType = localStorage.getItem("usageType") || "personal";
    setUsageType(storedUsageType);
  }, []);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/dashboard", {
          withCredentials: true, // Sends cookies (accessToken) for authentication
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Render the appropriate D3 chart based on usageType and dashboardData
  useEffect(() => {
    if (!dashboardData || isLoading) return;

    // Clear any previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    if (usageType === "personal") {
      // Personal User: Example Bar Chart for Expenses by Category
      const expenses = dashboardData.expenses;
      // Group expenses by category and sum amounts
      const expenseByCategory = d3.rollup(
        expenses,
        (v) => d3.sum(v, (d) => d.amount),
        (d) => d.category
      );
      const data = Array.from(expenseByCategory, ([category, total]) => ({ category, total }));

      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = 600 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3
        .select(chartRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.category))
        .range([0, width])
        .padding(0.1);
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.total)])
        .nice()
        .range([height, 0]);
      svg.append("g").call(d3.axisLeft(y));

      svg
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.category))
        .attr("y", (d) => y(d.total))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.total))
        .attr("fill", "steelblue");
    } else if (usageType === "organization") {
      // Organization User: Example Pie Chart for Aggregated Expenses by Category
      // Use the expenseAggregation provided by backend
      const aggData = dashboardData.expenseAggregation;
      // Sum total amounts by category from the aggregation result
      const categoryTotals = {};
      aggData.forEach((item) => {
        const category = item._id.category;
        categoryTotals[category] = (categoryTotals[category] || 0) + item.totalAmount;
      });
      const data = Object.entries(categoryTotals).map(([category, total]) => ({ category, total }));

      const width = 400;
      const height = 400;
      const radius = Math.min(width, height) / 2;
      const svg = d3
        .select(chartRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const color = d3.scaleOrdinal().domain(data.map((d) => d.category)).range(d3.schemeCategory10);

      const pie = d3.pie().value((d) => d.total);
      const data_ready = pie(data);

      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      svg
        .selectAll("path")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.category))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

      svg
        .selectAll("text")
        .data(data_ready)
        .enter()
        .append("text")
        .text((d) => d.data.category)
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", 12);
    }
  }, [dashboardData, isLoading, usageType]);

  if (isLoading) return <div>Loading Dashboard...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div ref={chartRef}></div>
    </div>
  );
};

export default Dashboard;
