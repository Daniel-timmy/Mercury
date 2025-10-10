import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const LineGraph = ({ entries }) => {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([
    { x: 0, y: "", location: "", activity: "" },
  ]);

  useEffect(() => {
    setPoints([{ x: 0, y: "", location: "", activity: "" }]);
    if (!entries || entries.length === 0) return;

    const status = {
      on_duty: "On duty",
      off_duty: "Off duty",
      driving: "Driving",
      sleeper: "Sleeper Berth",
    };
    entries.forEach((entry) => {
      setPoints((prevPoints) => {
        prevPoints[prevPoints.length - 1].y = status[entry.duty_status];
        const point = {
          x: entry.duration + prevPoints[prevPoints.length - 1].x,
          y: status[entry.duty_status],
          location: entry.location,
          activity: entry.activity,
          end_time: entry.end_time,
        };
        const nextPoint = {
          x: point.x,
          y: "",
          location: entry.location,
          activity: entry.activity,
          end_time: entry.end_time,
        };
        return [...prevPoints, point, nextPoint];
      });
    });
    setPoints((prevPoints) => {
      const updatedPoints = [...prevPoints];
      updatedPoints.pop();
      return updatedPoints;
    });
  }, [entries]);

  useEffect(() => {
    const updateDimensions = () => {
      const containerWidth =
        svgRef.current?.parentElement?.clientWidth || window.innerWidth;
      let width, height;
      let margin = { top: 20, right: 20, bottom: 30, left: 40 };

      if (containerWidth < 576) {
        width = Math.max(300, containerWidth - 20);
        height = 200;
      } else if (containerWidth < 768) {
        width = Math.max(580, containerWidth - 20);
        height = 400;
      } else {
        width = Math.min(1000, containerWidth - 20);
        height = 400;
      }

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("background", "#f9f9f9")
        .style("max-width", "100%")
        .style("height", "auto");

      svg.selectAll("*").remove();

      const xScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([margin.left, width - margin.right]);

      const yValues = ["Off duty", "Sleeper Berth", "Driving", "On duty"];
      const yScale = d3
        .scalePoint()
        .domain(yValues)
        .range([height - margin.bottom, margin.top])
        .padding(0.5);

      const line = d3
        .line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));

      svg
        .append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)
        .attr("d", line);

      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(24).tickFormat(d3.format("d")))
        .selectAll("text") // Format x-axis text
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "8px");

      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(24)
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat("")
        )
        .attr("stroke-opacity", 0.2);

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "8px");

      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat("")
        )
        .attr("stroke-opacity", 0.2);

      svg
        .selectAll(".dot")
        .data(points.filter((d) => d.y !== "")) // Filter out invalid points
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 4)
        .attr("fill", "steelblue")
        .on("mouseover", (event) => {
          d3.select(event.currentTarget).attr("r", 6);
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).attr("r", 4);
        })
        .on("click", (event, d) => {
          event.stopPropagation();
          event.preventDefault();
          d3.selectAll(".tooltip").remove();

          const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.3)")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("opacity", 0)
            .html(
              `Activity: ${d.activity} hours<br>Location: ${d.location}<br>End Time: ${d.end_time}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .transition()
            .duration(200)
            .style("opacity", 1);
        });

      d3.select("body").on("click.body", (event) => {
        if (!event.target.classList.contains("dot")) {
          d3.selectAll(".tooltip").remove();
        }
      });
    };

    updateDimensions();

    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      d3.select("body").on("click.body", null);
    };
  }, [points]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default LineGraph;
