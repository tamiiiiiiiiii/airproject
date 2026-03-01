import { render, screen } from '@testing-library/react';
import App from './App';

test('renders air quality page title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /уровень загрязнения воздуха/i })).toBeInTheDocument();
});
