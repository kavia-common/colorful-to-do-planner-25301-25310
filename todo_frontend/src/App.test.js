import { render, screen } from '@testing-library/react';
import App from './App';

test('renders App root without crashing', () => {
  render(<App />);
  expect(screen.getByTestId('app-root')).toBeInTheDocument();
});
