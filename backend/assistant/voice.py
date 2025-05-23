import speech_recognition as sr
import pyttsx3

recognizer = sr.Recognizer()
tts = pyttsx3.init()

first_message_skipped = False  # Flag to control first message

def speak(text):
    global first_message_skipped
    if not first_message_skipped:
        print(f"Skipped speaking: {text}")
        first_message_skipped = True
        return
    tts.say(text)
    tts.runAndWait()

def listen():
    with sr.Microphone() as source:
        print("Listening...")
        audio = recognizer.listen(source)
    try:
        return recognizer.recognize_google(audio)
    except sr.UnknownValueError:
        return "Sorry, I didn't understand that."

# Example loop:
while True:
    user_input = listen()
    print(f"You said: {user_input}")
    speak(user_input)
