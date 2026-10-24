class UniverseBundle:
    def __init__(self, universes):
        self.universes = universes

    def fiber(self, name):
        return self.universes.get(name, None)
