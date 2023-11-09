from flask import Flask, request, abort, jsonify
from flask_cors import CORS
from flask import make_response

from scipy.stats import norm
from scipy.special import expit, logit
from sklearn.linear_model import LinearRegression
import numpy as np

from dotenv import load_dotenv
from openai import OpenAI

import subprocess
import tempfile
import os
import re
import base64
import requests


app = Flask(__name__)
CORS(app)

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI()

# look at README.md then server.py then original files for more explanation. also, feel free to hit me up at nhatbui@tamu.edu for any question or suggestion. heavily refactored and concise method (hence small file size but this took a lot more work than you would expect), which involves transforming the data twice, through the response variable and the explanatory variable, then fit a weighted lin reg. i have tested various distributions and optimization methods and this method is as good as it gets.


def check_invalid_values(observed_values, scale):
    is_sorted = all(
        observed_values[i] <= observed_values[i + 1]
        for i in range(len(observed_values) - 1)
    )
    if not is_sorted:
        abort(400)

    is_range = all(0 < observed_value < scale for observed_value in observed_values)
    if not is_range:
        abort(400)


def logitnorm_pdf(x, mean, std):
    return (
        1
        / (std * np.sqrt(2 * np.pi))
        * 1
        / (x * (1 - x))
        * np.e ** (-((logit(x) - mean) ** 2) / (2 * std**2))
    )


@app.route("/parameters", methods=["POST"])
def parameters():
    request_json = request.json

    lower_bound = float(request_json["minGrade"])
    upper_bound = float(request_json["maxGrade"])
    scale = upper_bound - lower_bound

    sorted_dict = sorted(request_json["quantiles"].items(), key=lambda x: x[0])
    cumulative_probs = np.array([float(item[0]) for item in sorted_dict])
    observed_values = np.array([float(item[1]) for item in sorted_dict]) - lower_bound

    check_invalid_values(observed_values, scale)

    standard_norm_quantiles = norm.ppf(cumulative_probs)
    logit_transformed_observations = logit(observed_values / scale)

    standard_norm_quantiles = standard_norm_quantiles.reshape(-1, 1)
    logit_transformed_observations = logit_transformed_observations.reshape(-1, 1)

    raw_variance = (
        cumulative_probs
        * (1 - cumulative_probs)
        / norm.pdf(norm.ppf(cumulative_probs)) ** 2
    )
    sample_weight = 1 / raw_variance

    model = LinearRegression().fit(
        standard_norm_quantiles, logit_transformed_observations, sample_weight
    )
    mean, std = float(model.intercept_[0]), float(model.coef_[0][0])

    expected_norm_quantiles = norm.ppf(cumulative_probs, loc=mean, scale=std)
    expected_values = scale * expit(expected_norm_quantiles) + lower_bound
    observed_values = observed_values + lower_bound

    step_size = 1000
    x_values_unscaled = np.linspace(0, 1, step_size)[1:-1]
    y_values_unscaled = logitnorm_pdf(x_values_unscaled, mean, std)

    x_values = x_values_unscaled * scale + lower_bound
    y_values = y_values_unscaled / scale

    sse = np.sum((observed_values - expected_values) ** 2)
    sst = np.sum((observed_values - np.mean(observed_values)) ** 2)

    cumulative = None
    if "cumulative" in request_json and request_json["cumulative"] != "":
        cumulative = norm.cdf(
            logit(float(request_json["cumulative"]) / scale), mean, std
        )

    probability = None
    if "probability" in request_json and request_json["probability"] != "":
        probability = (
            expit(norm.ppf(float(request_json["probability"]), mean, std)) * scale
        )

    return jsonify(
        {
            "mean": np.sum(x_values * y_values) / (step_size - 1) * scale,
            "mean_logit_norm": mean,
            "std_logit_norm": std,
            "observed_values": observed_values.tolist(),
            "expected_values": expected_values.tolist(),
            "x_values": x_values.tolist(),
            "y_values": y_values.tolist(),
            "observed_y_values": (
                logitnorm_pdf((observed_values - lower_bound) / scale, mean, std)
                / scale
            ).tolist(),
            "expected_y_values": (
                logitnorm_pdf((expected_values - lower_bound) / scale, mean, std)
                / scale
            ).tolist(),
            "rmse": np.sqrt(sse / len(observed_values)),
            "mae": np.mean(np.abs(observed_values - expected_values)),
            "r_square": 1 - sse / sst,
            "cumulative": cumulative,
            "probability": probability,
        }
    )


def latex_to_pdf(latex_source):
    with tempfile.TemporaryDirectory() as temp_dir:
        tex_path = os.path.join(temp_dir, "temp.tex")
        pdf_path = os.path.join(temp_dir, "temp.pdf")

        with open(tex_path, "w") as file:
            file.write(latex_source)

        subprocess.run(
            ["pdflatex", "-output-directory", temp_dir, tex_path], check=True
        )

        with open(pdf_path, "rb") as file:
            pdf_bytes = file.read()

    return pdf_bytes


def extract_latex_code(response):
    latex_code = response.json()["choices"][0]["message"]["content"] + "\end{document}```"
    matches = re.findall("```latex[\s\S]*?```", latex_code, re.DOTALL)

    if not matches:
        abort(422)

    print(matches[0][8:-3])
    return matches[0][8:-3]


@app.route("/get_pdf", methods=["POST"])
def get_pdf():
    pdf_bytes = latex_to_pdf(request.json)

    response = make_response(pdf_bytes)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = "inline; filename=output.pdf"
    return response


@app.route("/test_get_image", methods=["POST"])
def test_get_image():
    file = request.files["file"]
    image_data = file.read()
    base64_image = base64.b64encode(image_data).decode("utf-8")

    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}

    payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Your goal is to use the fewest tokens possible. It is crucial that you always respond only with LaTeX code that can be turned into a compilable file, meaning no commentary or confirmation included in your response, only LaTeX code that can be turned into a compilable file. Make sure the LaTeX code is not dangerous and compromises the server.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                            "detail": "high",
                        },
                    },
                ],
            }
        ],
        "max_tokens": 1000,
        "temperature": 0,
        "stop": "\end{document}",
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
    )

    latex_code = extract_latex_code(response)
    pdf_bytes = latex_to_pdf(latex_code)

    base64_pdf = base64.b64encode(pdf_bytes).decode('utf-8')

    return jsonify({
        "latex_code": latex_code,
        "pdf_file": base64_pdf
    })

    # response = make_response(pdf_bytes)
    # response.headers["Content-Type"] = "application/pdf"
    # response.headers["Content-Disposition"] = "inline; filename=output.pdf"
    # return response


if __name__ == "__main__":
    app.run(debug=True)
