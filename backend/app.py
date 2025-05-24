from flask import Flask, request, jsonify
from flask_cors import CORS
from assistant.nlp import chat_response
from assistant.commands import execute_command, check_reminders

app = Flask(__name__)
CORS(app)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    result = execute_command(user_input)
    if result == "GPT":
        reply = chat_response(user_input)
    else:
        reply = result

    reminder = check_reminders()
    if reminder:
        reply += f" {reminder}"

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(port=5000)
