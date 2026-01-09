import { jest } from '@jest/globals';
import { TasksComponent } from './tasks.component';

describe('TasksComponent Filter Logic', () => {
  // 1. Define Mocks
  const mockAuth = {
    getToken: jest.fn(() => 'mock-token'),
    logout: jest.fn(),
  };
  const mockRouter = { navigate: jest.fn() } as any;
  const mockHttp = {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  } as any;
  const mockCdr = { markForCheck: jest.fn() } as any;

  it('should filter tasks by search query', () => {
    // 2. Initialize with CORRECT ORDER: auth, router, http, cdr
    const component = new TasksComponent(
      mockAuth as any, // slot 1: auth
      mockRouter, // slot 2: router
      mockHttp, // slot 3: http
      mockCdr, // slot 4: cdr
    );

    // 3. Set up data
    component.tasks = [
      { title: 'Buy milk', completed: false } as any,
      { title: 'Clean room', completed: true } as any,
    ];

    // 4. Perform Search
    component.searchQuery = 'milk';
    component.filterTasks();

    // 5. Assert
    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].title).toBe('Buy milk');
  });

  it('should filter tasks by completion status', () => {
    const component = new TasksComponent(
      mockAuth as any,
      mockRouter,
      mockHttp,
      mockCdr,
    );

    component.tasks = [
      { title: 'Task 1', completed: true } as any,
      { title: 'Task 2', completed: false } as any,
    ];

    // Testing the more advanced applyFilters method you have in your component
    component.statusFilter = 'completed';
    component.applyFilters();

    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].completed).toBe(true);
  });
});
