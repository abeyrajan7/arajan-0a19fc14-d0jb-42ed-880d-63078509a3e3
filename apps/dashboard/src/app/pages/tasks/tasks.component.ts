import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { decodeJwt } from '../../core/auth/jwt.util';
import { environment } from '../../../environments/environment';
import { TaskModalComponent } from './task-modal.component';
import { FormsModule } from '@angular/forms';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

interface TaskResponse {
  message: string;
  tasks: any[];
}
export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  organizationId: number;
  createdBy: {
    id: number;
    email: string;
  };
}
@Component({
  standalone: true,
  selector: 'app-tasks',
  imports: [CommonModule, TaskModalComponent, FormsModule, DragDropModule],
  templateUrl: './tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent implements OnInit {
  // Using string type prevents the "unintentional comparison" error
  role: string = 'viewer';
  loading = true;
  orgId: number = 0;
  userId: number = 0;
  tasks: Task[] = [];
  filteredTasks: any[] = [];
  // List of unique users for the "Categorize" dropdown
  uniqueUsers: string[] = [];
  isOrderChanged = false;

  // Filter States
  searchQuery = '';
  statusFilter = 'all'; // 'all', 'completed', 'incomplete'
  categoryFilter = 'all'; // Filter by User Email/Category

  // Modal State
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedTask: any = { title: '', description: '', completed: false };

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    const token = this.auth.getToken();
    const payload = token ? decodeJwt<any>(token) : null;

    this.role = payload?.role || 'viewer';
    this.role = payload?.role || 'VIEWER';
    this.orgId = payload?.organizationId || 0;
    this.userId = payload?.userId || 0;
  }

  ngOnInit() {
    this.fetchTasks();
  }

  drop(event: CdkDragDrop<any[]>) {
    if (this.role === 'ADMIN' && this.orgId === 1) {
      moveItemInArray(
        this.filteredTasks,
        event.previousIndex,
        event.currentIndex,
      );

      const newOrderIds = this.filteredTasks.map((t) => t.id);

      this.http
        .put(`${environment.apiBaseUrl}/tasks/reorder`, newOrderIds)
        .subscribe({
          next: () => console.log('Order updated in database'),
          error: (err) => console.error('Error saving order', err),
        });

      this.isOrderChanged = true;
      this.cdr.markForCheck();
    }
  }

  saveNewOrder() {
    const newOrderIds = this.filteredTasks.map((t) => t.id);

    this.http
      .put(`${environment.apiBaseUrl}/tasks/reorder`, newOrderIds)
      .subscribe({
        next: () => {
          this.isOrderChanged = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Reorder error:', err);
        },
      });
  }

  // Logic to determine if a user can edit/delete a specific task
  // apps/dashboard/src/app/pages/tasks/tasks.component.ts
  // Inside your TasksComponent class
  canManageTask(task: any): boolean {
    // 1. Super Admin (Org 1 Admin) can manage everything
    if (this.role === 'ADMIN' && this.orgId === 1) return true;

    // 2. Branch Admin (Org 2+ Admin) can manage all tasks in their organization
    // This allows Branch_Admin to edit/delete tasks from Branch_Owner
    if (this.role === 'ADMIN' && this.orgId === task.organizationId)
      return true;

    // 3. Owners/Creators can only manage their own tasks
    if (this.role === 'OWNER' && task.createdBy?.id === this.userId)
      return true;

    return false;
  }

  fetchTasks() {
    this.loading = true; // 1. Start loading
    this.http.get<any>(`${environment.apiBaseUrl}/tasks`).subscribe({
      next: (res) => {
        // 2. Assign the array from the 'tasks' key
        this.tasks = res.tasks || [];
        this.applyFilters(); // Initial filter apply
        this.extractUniqueUsers();
        // 3. CRITICAL: Stop loading so the HTML switches to the @else block
        this.loading = false;

        console.log(
          'Successfully assigned tasks array:',
          this.tasks,
          this.loading,
        );
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Fetch failed:', err);
        this.loading = false;
      },
    });
  }

  extractUniqueUsers() {
    const emails = this.tasks.map((t) => t.createdBy?.email).filter((e) => !!e);
    this.uniqueUsers = [...new Set(emails)]; 
  }

  applyFilters() {
    this.filteredTasks = this.tasks.filter((task) => {
      // 1. Search Logic (Title or Description)
      const matchesSearch =
        task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (task.description &&
          task.description
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()));

      // 2. Status Filter
      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'completed' && task.completed) ||
        (this.statusFilter === 'incomplete' && !task.completed);

      // 3. Category (User) Filter
      const matchesCategory =
        this.categoryFilter === 'all' ||
        task.createdBy?.email === this.categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
    this.cdr.markForCheck();
  }

  addTask() {
    this.modalMode = 'create';
    this.selectedTask = { title: '', description: '', completed: false };
    this.isModalOpen = true;
  }

  editTask(task: any) {
    this.modalMode = 'edit';
    this.selectedTask = { ...task };
    this.isModalOpen = true;
  }

  deleteTask(id: any) {
    if (confirm('Delete this task?')) {
      this.http
        .delete(`${environment.apiBaseUrl}/tasks/${id}`)
        .subscribe(() => this.fetchTasks());
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  handleModalSubmit(data: any) {
    if (this.modalMode === 'create') {
      this.http.post(`${environment.apiBaseUrl}/tasks`, data).subscribe(() => {
        this.isModalOpen = false;
        this.fetchTasks();
      });
    } else {
      this.http
        .put(`${environment.apiBaseUrl}/tasks/${data.id}`, data)
        .subscribe(() => {
          this.isModalOpen = false;
          this.fetchTasks();
        });
    }
  }

  filterTasks() {
    const query = this.searchQuery.toLowerCase();
    this.filteredTasks = this.tasks.filter((task) =>
      task.title.toLowerCase().includes(query),
    );
  }
}
