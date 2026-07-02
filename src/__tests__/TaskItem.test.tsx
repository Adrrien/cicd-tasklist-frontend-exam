import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
    it('renders task title and description', () => {
        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders task without description', () => {
        const taskNoDesc = { ...mockTask, description: null };
        render(
            <TaskItem
                task={taskNoDesc}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('calls onToggle when checkbox is clicked', () => {
        const onToggle = vi.fn();
        render(
            <TaskItem
                task={mockTask}
                onToggle={onToggle}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('checkbox'));
        expect(onToggle).toHaveBeenCalledWith(1);
    });

    it('enters edit mode when edit button is clicked', () => {
        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByLabelText('Modifier'));
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    });

    it('calls onEdit when saving in edit mode', () => {
        const onEdit = vi.fn();
        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={onEdit}
            />
        );

        fireEvent.click(screen.getByLabelText('Modifier'));
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(onEdit).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Test Task' }));
    });

    it('cancels edit mode without saving', () => {
        const onEdit = vi.fn();
        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={onEdit}
            />
        );

        fireEvent.click(screen.getByLabelText('Modifier'));
        fireEvent.click(screen.getByText('Annuler'));

        expect(onEdit).not.toHaveBeenCalled();
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('shows completed styling when task is completed', () => {
        const completedTask = { ...mockTask, completed: true };
        render(
            <TaskItem
                task={completedTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        const taskItem = screen.getByTestId('task-item');
        expect(taskItem).toHaveClass('task-completed');
    });

    it('requires confirmation before delete and calls onDelete on second click', () => {
        const onDelete = vi.fn();
        vi.useFakeTimers();

        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={onDelete}
                onEdit={vi.fn()}
            />
        );

        const deleteBtn = screen.getByLabelText('Supprimer');
        // first click shows confirmation icon
        fireEvent.click(deleteBtn);
        expect(screen.getByText('⚠️')).toBeInTheDocument();

        // second click should call onDelete
        fireEvent.click(deleteBtn);
        expect(onDelete).toHaveBeenCalledWith(1);

        vi.useRealTimers();
    });

    it('saves edited values trimmed and sends undefined description when empty', () => {
        const onEdit = vi.fn();
        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={onEdit}
            />
        );

        fireEvent.click(screen.getByLabelText('Modifier'));
        const titleInput = screen.getByLabelText('Modifier le titre') as HTMLInputElement;
        const descInput = screen.getByLabelText('Modifier la description') as HTMLTextAreaElement;

        fireEvent.change(titleInput, { target: { value: '  New Title  ' } });
        fireEvent.change(descInput, { target: { value: '' } });

        fireEvent.click(screen.getByText('Enregistrer'));

        expect(onEdit).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'New Title', description: undefined }));
    });
});
