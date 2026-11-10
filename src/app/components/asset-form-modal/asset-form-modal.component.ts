import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Department } from '../../services/department.service';
export interface AssetFormModel {
  itemName: string; serialNumber: string; assetNumber: string; departmentName: string; budgetYear: string;
  brand: string; model: string; location: string; room: string; notes: string;
}

@Component({
  selector: 'app-asset-form-modal', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-form-modal.component.html',
  styleUrl: './asset-form-modal.component.css',
})
export class AssetFormModalComponent {
  @Input({ required: true }) form!: AssetFormModel;
  @Input() saving = false;
  @Input() editing = false;
  @Input() formError = '';
  @Input() departments: Department[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<Event>();
}
