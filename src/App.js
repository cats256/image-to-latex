import React, { useState, useEffect } from "react";
import Latex from "react-latex";
import "./App.css";

const exampleText = `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\begin{document}

Type your \\LaTeX\\ here. For example: $\\frac{1}{2}$

\\end{document}`;

function App() {
    const [inputText, setInputText] = useState(exampleText);

    const handleInputChange = (event) => {
        setInputText(event.target.value);
        console.log(JSON.stringify(inputText));
    };

    const downloadPdf = () => {
        fetch("https://willb256.pythonanywhere.com/get_pdf", {
            method: "POST",
            body: JSON.stringify({ latex: inputText }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "output.pdf");

                document.body.appendChild(link);

                link.click();

                link.parentNode.removeChild(link);
            });
    };

    useEffect(() => {
        if (!inputValues["minGrade"] || !inputValues["maxGrade"] || Object.keys(inputValues["quantiles"]).length <= 1) {
            return;
        }

        fetch("https://willb256.pythonanywhere.com/parameters", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(inputValues),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setParameters(data);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }, [inputValues]);

    return (
        <div className="app-container" style={{ fontSize: 24 }}>
            <textarea
                value={inputText === exampleText ? "" : inputText}
                onChange={handleInputChange}
                placeholder={exampleText}
            />
            {/* <Latex>{inputText}</Latex> */}
            <button onClick={downloadPdf}>Download PDF</button>
        </div>
    );
}

export default App;
