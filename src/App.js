import React, { useState } from "react";
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
    };

    const downloadPdf = () => {
        fetch("https://willb256.pythonanywhere.com/get_pdf", {
            method: "POST",
            body: JSON.stringify(inputText),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, "_blank");
                window.URL.revokeObjectURL(url);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    return (
        <div className="app-container" style={{ fontSize: 24 }}>
            <textarea
                value={inputText === exampleText ? "" : inputText}
                onChange={handleInputChange}
                placeholder={exampleText}
            />
            {/* <Latex>{inputText}</Latex> */}
            <button onClick={downloadPdf}>Download PDF</button>
            <embed type="application/pdf" src="8.pdf" width="500" height="375" />
        </div>
    );
}

export default App;
