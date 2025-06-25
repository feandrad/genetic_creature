# Genetic Creature Walking Training Demo

A fascinating demonstration of genetic algorithms applied to creature locomotion, featuring skeletal creatures that learn to walk through evolutionary processes.

## 🐉 Overview

This project showcases how genetic algorithms can be used to evolve walking behaviors for virtual creatures. The demo includes:

- **Skeletal Creature System**: Modular bone-based creatures (dragons, horses, etc.)
- **Genetic Algorithm Training**: Evolutionary optimization of walking patterns
- **Real-time Visualizer**: Interactive 3D visualization using p5.js
- **Physics Simulation**: Realistic physics for creature movement

## 🏗️ Project Structure

```
genetic_creature/
├── creatures/           # Creature definitions (JSON)
│   ├── dragon.json     # Dragon skeletal structure
│   └── horse.json      # Horse skeletal structure
├── shared/             # Shared models and physics
│   ├── models/         # Common creature models
│   └── physics/        # Physics engine components
├── trainer/            # Genetic algorithm training
│   ├── genetic/        # Genetic algorithm implementation
│   ├── simulation/     # Creature simulation engine
│   └── utils/          # Training utilities
└── visualizer/         # Web-based visualization
    ├── assets/         # Visual assets
    ├── data/           # Training data
    ├── js/             # JavaScript files
    │   └── sketch.js   # p5.js visualization code
    └── index.html      # Main visualization page
```

## 🚀 Getting Started

### Prerequisites

- Modern web browser with JavaScript enabled
- No additional dependencies required (uses CDN for p5.js)

### Running the Visualizer

1. Clone or download this repository
2. Open `visualizer/index.html` in your web browser
3. The skeleton visualizer will load and display the creature structure

### Training New Creatures

1. Define your creature structure in JSON format (see `creatures/dragon.json` for reference)
2. Configure genetic algorithm parameters in the trainer
3. Run the training simulation
4. Visualize the evolved walking patterns

## 🧬 How It Works

### Creature Definition

Creatures are defined as hierarchical bone structures in JSON format:

```json
{
  "bones": [
    {
      "id": "shoulders",
      "parent": null,
      "length": 0,
      "angle": 0
    },
    {
      "id": "spine",
      "parent": "shoulders",
      "length": 50,
      "angle": -110
    }
  ]
}
```

### Genetic Algorithm Process

1. **Initialization**: Random walking patterns are generated
2. **Simulation**: Each creature attempts to walk in a physics environment
3. **Evaluation**: Fitness is calculated based on distance traveled and energy efficiency
4. **Selection**: Best performers are selected for reproduction
5. **Crossover**: Walking patterns are combined to create offspring
6. **Mutation**: Random changes are introduced to maintain diversity
7. **Iteration**: Process repeats until optimal walking patterns emerge

### Visualization

The p5.js-based visualizer provides:
- Real-time skeleton rendering
- Joint and bone visualization
- Color-coded joint types (root vs. child joints)
- Interactive viewing angles

## 🎯 Features

- **Modular Design**: Easy to add new creature types
- **Real-time Visualization**: Watch creatures evolve in real-time
- **Physics Integration**: Realistic movement simulation
- **Genetic Optimization**: Automatic walking pattern evolution
- **Cross-platform**: Works in any modern web browser

## 🔧 Customization

### Adding New Creatures

1. Create a new JSON file in the `creatures/` directory
2. Define the bone structure following the existing format
3. Update the visualizer to load your new creature

### Modifying Genetic Parameters

Adjust training parameters in the genetic algorithm to:
- Change mutation rates
- Modify selection pressure
- Adjust population size
- Fine-tune fitness functions

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new creature types
- Improve the genetic algorithm
- Enhance the visualization
- Optimize the physics simulation
- Add new features

## 📄 License

This project is licensed under the Creative Commons Attribution 4.0 International License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Karl Sims' seminal work on evolved virtual creatures
- Built with [p5.js](https://p5js.org/) for visualization
- Genetic algorithm concepts from evolutionary computation research

## 📚 Further Reading

- [Evolved Virtual Creatures by Karl Sims](https://www.karlsims.com/evolved-virtual-creatures.html)
- [Genetic Algorithms in Machine Learning](https://en.wikipedia.org/wiki/Genetic_algorithm)
- [Physics-based Animation](https://en.wikipedia.org/wiki/Physics_animation)

---

*Watch as digital creatures learn to walk through the power of evolution!* 🦕 