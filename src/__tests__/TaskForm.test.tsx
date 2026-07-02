import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
    it('renders create form by default', () => {
        render(<TaskForm onSubmit={vi.fn()} />);
        expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
        expect(screen.getByText('Ajouter')).toBeInTheDocument();
    });

    it('renders edit form when mode is edit', () => {
        render(<TaskForm onSubmit={vi.fn()} mode="edit" />);
        expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
        expect(screen.getByText('Modifier')).toBeInTheDocument();
    });

    it('shows validation error when title is empty', () => {
        render(<TaskForm onSubmit={vi.fn()} />);
        fireEvent.click(screen.getByText('Ajouter'));
        expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
    });

    it('calls onSubmit with title when form is submitted', () => {
        const onSubmit = vi.fn();
        render(<TaskForm onSubmit={onSubmit} />);

        fireEvent.change(screen.getByLabelText('Titre'), {
            target: { value: 'Nouvelle tâche' },
        });
        fireEvent.click(screen.getByText('Ajouter'));

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Nouvelle tâche',
        }));
    });

    it('clears form after successful submit in create mode', () => {
        render(<TaskForm onSubmit={vi.fn()} />);
        const input = screen.getByLabelText('Titre');

        fireEvent.change(input, { target: { value: 'Test' } });
        fireEvent.click(screen.getByText('Ajouter'));

        expect(input).toHaveValue('');
    });

    it('renders with initial values', () => {
        render(
            <TaskForm
                onSubmit={vi.fn()}
                mode="edit"
                initialValues={{ title: 'Titre existant', description: 'Desc existante' }}
            />
        );
        expect(screen.getByDisplayValue('Titre existant')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Desc existante')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);

        fireEvent.click(screen.getByText('Annuler'));
        expect(onCancel).toHaveBeenCalled();
    });
});
