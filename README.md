# Criaturas Robóticas: Um Simulador de Evolução Genética

Este projeto simula a evolução de criaturas robóticas em um ambiente 2D. O objetivo principal é que essas criaturas, compostas por um esqueleto com juntas motorizadas (servo motores), aprendam a se levantar e a manter o equilíbrio, lutando contra a gravidade.

O sucesso de cada robô é medido pela sua capacidade de elevar seu centro de gravidade. Um algoritmo genético otimiza a rede neural que controla os servo motores, buscando a estratégia de movimento mais eficiente para alcançar a maior altura possível.

## Funcionalidades

- **Evolução por Algoritmo Genético**: Utiliza o algoritmo NEAT para evoluir as redes neurais que controlam os robôs.
- **Simulação de Robôs 2D**: As criaturas são esqueletos 2D com juntas que funcionam como servo motores.
- **Fitness Baseado no Centro de Gravidade**: A aptidão é calculada com base na altura do centro de gravidade.
- **Visualização Interativa**: Uma interface web (usando p5.js) permite observar o comportamento dos robôs.

## Estrutura do Projeto

```
genetic_creature/
├── creatures/           # Definições das criaturas (JSON)
│   ├── dragon.json     # Estrutura do esqueleto do dragão
│   └── horse.json      # Estrutura do esqueleto do cavalo
├── shared/             # Código compartilhado
│   ├── models/         # Modelos de criaturas
│   └── physics/        # Motor de física
├── trainer/            # Lógica de treinamento
│   ├── genetic/        # Implementação do algoritmo genético
│   ├── simulation/     # Motor de simulação da criatura
│   └── utils/          # Utilitários de treinamento
└── visualizer/         # Visualização baseada na web
    ├── data/           # Dados do treinamento (criaturas salvas)
    ├── js/             # Arquivos JavaScript
    │   └── sketch.js   # Código de visualização com p5.js
    └── index.html      # Página principal da visualização
```

## Como Executar

1.  **Instale as dependências**:

    ```bash
    npm install
    ```

2.  **Inicie o treinamento**:

    ```bash
    npm run train
    ```

    Este comando inicia a simulação. Os robôs de cada geração são salvos no diretório `visualizer/data/`.

3.  **Visualize os resultados**:

    ```bash
    npm start
    ```

    Abra seu navegador e acesse `http://localhost:3000`. Use o menu para selecionar a geração que deseja visualizar.

## Como Funciona

### Definição da Criatura

As criaturas são definidas como uma estrutura hierárquica de ossos em formato JSON. A estrutura define a conexão entre os ossos, seu comprimento e outras propriedades físicas:

-   `angle`: O ângulo inicial do osso em relação ao seu osso "pai".
-   `mov_angle`: O ângulo máximo (em graus) que o servo motor da junta pode se mover a partir da posição `angle`.
-   `strength`: A força do motor da junta.
-   `weight`: O peso do osso, usado para calcular o centro de gravidade.

```json
{
  "bones": [
    {
      "id": "shoulders",
      "parent": null,
      "length": 0,
      "angle": 0,
      "strength": 1.0,
      "mov_angle": 0.0,
      "weight": 1.0
    },
    {
      "id": "spine",
      "parent": "shoulders",
      "length": 50,
      "angle": -100,
      "strength": 1.0,
      "mov_angle": 0.0,
      "weight": 1.0
    }
  ]
}
```

### Processo do Algoritmo Genético

O treinamento segue um processo evolutivo:

1.  **Inicialização**: Uma população de robôs é criada com redes neurais aleatórias.
2.  **Simulação**: Cada robô é testado no ambiente de física, e seus movimentos são controlados pela sua rede neural.
3.  **Avaliação**: A aptidão (fitness) é calculada com base na altura que o centro de gravidade da criatura alcança.
4.  **Seleção**: Os indivíduos com melhor desempenho são selecionados para a próxima geração.
5.  **Crossover (Recombinação)**: As redes neurais dos pais são combinadas para gerar descendentes, herdando características.
6.  **Mutação**: Pequenas alterações aleatórias são introduzidas nas redes neurais dos descendentes para garantir a diversidade genética.
7.  **Iteração**: O processo se repete por muitas gerações, resultando em robôs com comportamentos de movimento cada vez mais otimizados.

## Próximos Passos e Melhorias

- **Funções de Fitness Mais Complexas**: Implementar novas métricas, como distância percorrida ou estabilidade.
- **Ambientes Dinâmicos**: Adicionar obstáculos ou terrenos irregulares.
- **Interação do Usuário**: Permitir a aplicação de forças externas para testar a estabilidade dos robôs.