import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders correctly', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('has correct default classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
    });

    it('accepts custom className', () => {
      render(<Input className="custom-input" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('custom-input');
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text..." />);
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });
  });

  describe('Types', () => {
    it('renders text input by default', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      render(<Input type="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(<Input type="password" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<Input type="number" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
    });

    it('renders file input with special styles', () => {
      render(<Input type="file" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('can be readonly', () => {
      render(<Input readOnly value="readonly value" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('readonly');
    });

    it('can be required', () => {
      render(<Input required data-testid="input" />);
      expect(screen.getByTestId('input')).toBeRequired();
    });
  });

  describe('Value Handling', () => {
    it('shows initial value', () => {
      render(<Input defaultValue="initial value" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('initial value');
    });

    it('handles controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('controlled');
    });

    it('calls onChange when typing', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={onChange} data-testid="input" />);

      await user.type(screen.getByTestId('input'), 'test');

      expect(onChange).toHaveBeenCalled();
    });

    it('updates value when typing', async () => {
      const user = userEvent.setup();

      render(<Input data-testid="input" />);

      await user.type(screen.getByTestId('input'), 'hello world');

      expect(screen.getByTestId('input')).toHaveValue('hello world');
    });
  });

  describe('Focus and Blur', () => {
    it('calls onFocus when focused', async () => {
      const onFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={onFocus} data-testid="input" />);

      await user.click(screen.getByTestId('input'));

      expect(onFocus).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', async () => {
      const onBlur = vi.fn();
      const user = userEvent.setup();

      render(<Input onBlur={onBlur} data-testid="input" />);

      const input = screen.getByTestId('input');
      await user.click(input);
      await user.tab();

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('allows focusing via ref', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} data-testid="input" />);

      ref.current?.focus();

      expect(screen.getByTestId('input')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('can have aria-label', () => {
      render(<Input aria-label="Username input" data-testid="input" />);
      expect(screen.getByLabelText('Username input')).toBeInTheDocument();
    });

    it('can have aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="helper" data-testid="input" />
          <span id="helper">Helper text</span>
        </>
      );
      expect(screen.getByTestId('input')).toHaveAttribute('aria-describedby', 'helper');
    });

    it('supports aria-invalid for error state', () => {
      render(<Input aria-invalid="true" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Constraints', () => {
    it('supports minLength', () => {
      render(<Input minLength={5} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('minLength', '5');
    });

    it('supports maxLength', () => {
      render(<Input maxLength={10} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('maxLength', '10');
    });

    it('supports pattern', () => {
      render(<Input pattern="[A-Za-z]+" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('supports min for number input', () => {
      render(<Input type="number" min={0} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('min', '0');
    });

    it('supports max for number input', () => {
      render(<Input type="number" max={100} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('max', '100');
    });
  });
});
