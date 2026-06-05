function transpose(matrix) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function multiply(a, b) {
  return a.map((row) =>
    b[0].map((_, column) =>
      row.reduce((sum, value, index) => sum + value * b[index][column], 0),
    ),
  );
}

function identity(size) {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0)),
  );
}

function inverse(matrix) {
  const size = matrix.length;
  const augmented = matrix.map((row, index) => [...row, ...identity(size)[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }

    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column] || 1e-12;
    augmented[column] = augmented[column].map((value) => value / divisor);

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map(
        (value, index) => value - factor * augmented[column][index],
      );
    }
  }

  return augmented.map((row) => row.slice(size));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function standardDeviation(values, valueMean) {
  const variance =
    values.reduce((sum, value) => sum + (value - valueMean) ** 2, 0) /
    Math.max(values.length, 1);
  return Math.sqrt(variance) || 1;
}

export function trainRidgeRegression(rows, lambda = 0.15) {
  const columns = rows[0].features.length;
  const featureColumns = Array.from({ length: columns }, (_, column) =>
    rows.map((row) => row.features[column]),
  );
  const means = featureColumns.map((values) => mean(values));
  const stds = featureColumns.map((values, index) => standardDeviation(values, means[index]));

  const x = rows.map((row) => [
    1,
    ...row.features.map((value, index) => (value - means[index]) / stds[index]),
  ]);
  const y = rows.map((row) => [row.target]);
  const xt = transpose(x);
  const xtx = multiply(xt, x);
  const regularizer = identity(xtx.length).map((row, rowIndex) =>
    row.map((value, columnIndex) => (rowIndex === 0 && columnIndex === 0 ? 0 : value * lambda)),
  );
  const penalized = xtx.map((row, rowIndex) =>
    row.map((value, columnIndex) => value + regularizer[rowIndex][columnIndex]),
  );
  const coefficients = multiply(multiply(inverse(penalized), xt), y).map((row) => row[0]);
  const predictions = x.map((features) =>
    coefficients.reduce((sum, coefficient, index) => sum + coefficient * features[index], 0),
  );
  const actual = rows.map((row) => row.target);
  const yMean = mean(actual);
  const ssRes = actual.reduce((sum, value, index) => sum + (value - predictions[index]) ** 2, 0);
  const ssTot = actual.reduce((sum, value) => sum + (value - yMean) ** 2, 0) || 1;
  const r2 = 1 - ssRes / ssTot;
  const mae = mean(actual.map((value, index) => Math.abs(value - predictions[index])));

  return {
    type: "ridge-regression",
    coefficients,
    means,
    stds,
    featureCount: columns,
    metrics: { r2, mae, samples: rows.length },
  };
}

export function predictRidge(model, features) {
  const normalized = features.map(
    (value, index) => (value - model.means[index]) / model.stds[index],
  );
  const vector = [1, ...normalized];
  return model.coefficients.reduce(
    (sum, coefficient, index) => sum + coefficient * vector[index],
    0,
  );
}
