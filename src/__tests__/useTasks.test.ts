import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';

const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Description',
    completed: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('useTasks', () => {
    it('loads tasks on mount', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.tasks).toEqual([mockTask]);
        expect(result.current.error).toBeNull();
    });

    it('starts with loading true', () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
        const { result } = renderHook(() => useTasks());
        expect(result.current.loading).toBe(true);
    });

    it('handles load error', async () => {
        vi.spyOn(taskApi, 'getTasks').mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
        expect(result.current.tasks).toEqual([]);
    });

    it('adds task to list', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
        vi.spyOn(taskApi, 'createTask').mockResolvedValue(mockTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.addTask({ title: 'Test Task' });
        });

        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0]).toEqual(mockTask);
    });

    it('removes task from list', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);
        vi.spyOn(taskApi, 'deleteTask').mockResolvedValue(undefined);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.removeTask(1);
        });

        expect(result.current.tasks).toHaveLength(0);
    });

    it('edits task in list', async () => {
        const updatedTask = { ...mockTask, title: 'Updated Title' };
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);
        vi.spyOn(taskApi, 'updateTask').mockResolvedValue(updatedTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.editTask(1, { title: 'Updated Title' });
        });

        expect(result.current.tasks[0].title).toBe('Updated Title');
    });

    it('toggleComplete does nothing if task not found', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.toggleComplete(999);
        });

        expect(result.current.tasks).toEqual([]);
    });

});
