import json

class DBZLoader:
    def __init__(self, path):
        with open(path) as f:
            self.data = json.load(f)

    def characters(self):
        return self.data["characters"]

    def forms(self):
        return self.data["forms"]

    def sagas(self):
        return self.data["sagas"]

    def timelines(self):
        return self.data["timelines"]

    def cosmology(self):
        return self.data["cosmology"]
