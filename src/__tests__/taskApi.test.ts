import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
    id: 1,
    title: 'Test',
    description: null,
    completed: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('taskApi', () => {
    it('getTasks returns array of tasks', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([mockTask]),
        }));

        const tasks = await getTasks();
        expect(tasks).toEqual([mockTask]);
        expect(fetch).toHaveBeenCalledWith('/api/tasks');
    });

    it('getTasks throws on HTTP error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Internal Server Error'),
        }));

        await expect(getTasks()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('createTask creates and returns task', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockTask),
        }));

        const task = await createTask({ title: 'Test' });
        expect(task).toEqual(mockTask);
        expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Test' }),
        }));
    });

    it('updateTask updates and returns task', async () => {
        const updated = { ...mockTask, completed: true };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(updated),
        }));

        const task = await updateTask(1, { completed: true });
        expect(task.completed).toBe(true);
        expect(fetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
            method: 'PUT',
        }));
    });

    it('deleteTask calls DELETE endpoint', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

        await deleteTask(1);
        expect(fetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
            method: 'DELETE',
        }));
    });

    it('deleteTask throws on error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            text: () => Promise.resolve('Not Found'),
        }));

        await expect(deleteTask(999)).rejects.toThrow('HTTP 404: Not Found');
    });
});
