import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-modal.component.html',
})
export class TaskModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Task';
  @Input() mode: 'create' | 'edit' = 'create';

  // The task data we are working with
  @Input() taskData: any = { title: '', description: '', completed: false };

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  onSave() {
    this.submit.emit(this.taskData);
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
