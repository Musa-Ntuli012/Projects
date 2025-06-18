import requests
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.recycleview import RecycleView
from kivy.uix.popup import Popup
from kivy.uix.recycleview.views import RecycleDataViewBehavior
from kivy.properties import StringProperty
from kivy.graphics import Color, Rectangle
from kivy.core.window import Window

# Set the window size (optional)
Window.size = (400, 600)


class TaskItem(RecycleDataViewBehavior, Label):
    text = StringProperty("")


class TaskList(RecycleView):
    def __init__(self, **kwargs):
        super(TaskList, self).__init__(**kwargs)
        self.data = []

    def update_tasks(self, tasks):
        self.data = [{'text': task} for task in tasks]


class TodoListApp(App):
    def build(self):
        self.tasks = []

        self.layout = BoxLayout(orientation='vertical', padding=10, spacing=10)

        # Adding a canvas to set the background color
        with self.layout.canvas.before:
            Color(0.2, 0.2, 0.2, 1)  # Dark gray background
            self.rect = Rectangle(size=self.layout.size, pos=self.layout.pos)

        self.layout.bind(size=self._update_rect, pos=self._update_rect)

        self.task_input = TextInput(hint_text='Enter a task', multiline=False, size_hint_y=None, height=40)
        self.task_input.background_color = (0.9, 0.9, 0.9, 1)
        self.layout.add_widget(self.task_input)

        button_layout = BoxLayout(orientation='horizontal', size_hint_y=None, height=50, spacing=10)

        self.add_button = Button(text='Add Task', background_color=(0.1, 0.6, 0.1, 1))
        self.add_button.bind(on_press=self.add_task)
        button_layout.add_widget(self.add_button)

        self.remove_button = Button(text='Remove Task', background_color=(0.6, 0.1, 0.1, 1))
        self.remove_button.bind(on_press=self.remove_task)
        button_layout.add_widget(self.remove_button)

        self.save_button = Button(text='Save Tasks', background_color=(0.6, 0.6, 0.1, 1))
        self.save_button.bind(on_press=self.save_to_file)
        button_layout.add_widget(self.save_button)

        self.quote_button = Button(text='Get Quote', background_color=(0.1, 0.4, 0.6, 1))
        self.quote_button.bind(on_press=self.fetch_motivational_quote)
        button_layout.add_widget(self.quote_button)

        self.layout.add_widget(button_layout)

        # Create a RecycleView to display tasks
        self.task_list = TaskList(size_hint_y=None, height=200)
        self.layout.add_widget(self.task_list)

        return self.layout

    def _update_rect(self, instance, value):
        self.rect.pos = instance.pos
        self.rect.size = instance.size

    def add_task(self, instance):
        task = self.task_input.text.strip()
        if task:
            self.tasks.append(task)
            self.task_input.text = ''
            self.update_task_list()
            self.show_popup("Task Added", f'Task "{task}" added.')
        else:
            self.show_popup("Error", "Please enter a task.")

    def remove_task(self, instance):
        task = self.task_input.text.strip()
        if task in self.tasks:
            self.tasks.remove(task)
            self.task_input.text = ''
            self.update_task_list()
            self.show_popup("Task Removed", f'Task "{task}" removed.')
        else:
            self.show_popup("Error", f'Task "{task}" not found.')

    def save_to_file(self, instance):
        filename = "tasks.txt"
        with open(filename, 'w') as file:
            for task in self.tasks:
                file.write(f"{task}\n")
        self.show_popup("Tasks Saved", f'Tasks saved to {filename}.')

    def fetch_motivational_quote(self, instance):
        try:
            response = requests.get("https://type.fit/api/quotes")
            if response.status_code == 200:
                quotes = response.json()
                quote = quotes[0]  # Get the first quote
                self.show_popup("Motivational Quote", f'"{quote["text"]}" - {quote["author"]}')
            else:
                self.show_popup("Error", "Could not fetch a quote at this time.")
        except Exception as e:
            self.show_popup("Error", f"An error occurred: {e}")

    def update_task_list(self):
        self.task_list.update_tasks(self.tasks)

    def show_popup(self, title, message):
        popup = Popup(title=title, content=Label(text=message), size_hint=(0.8, 0.4))
        popup.open()


if __name__ == "__main__":
    TodoListApp().run()