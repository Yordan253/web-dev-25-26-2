import { Component } from '@angular/core';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators,
  ValidatorFn, AbstractControl, ValidationErrors
} from '@angular/forms';
import { FormsModule } from '@angular/forms'; // 👈 add this
import { RouterOutlet } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

/** Domain validator (from your previous task) */
function allowedDomainValidator(domains: string[]): ValidatorFn {
  const allowed = domains.map(d => d.replace(/^@/, '').toLowerCase());
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = (control.value ?? '').toLowerCase().trim();
    if (!value) return null;
    const at = value.lastIndexOf('@');
    if (at < 0) return null;
    const domain = value.slice(at + 1);
    return allowed.includes(domain) ? null : { domain: true };
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    InputTextModule,
    ButtonModule,
    MessageModule,
    ReactiveFormsModule,
    FormsModule,              // 👈 add this
    TableModule,
    Select,
    ConfirmDialogModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [ConfirmationService]
})
export class AppComponent {
  registrationForm: FormGroup;

  // Filters 👇
  firstNameFilter = '';
  lastNameFilter  = '';
  emailFilter     = '';
  universityFilter: string | null = null;

  users: Array<{ firstName: string; lastName: string; email: string; university: string }> = [];

  universities = [
    { label: 'Harvard University', value: 'Harvard University' },
    { label: 'Stanford University', value: 'Stanford University' },
    { label: 'MIT', value: 'MIT' },
    { label: 'Oxford University', value: 'Oxford University' },
    { label: 'Cambridge University', value: 'Cambridge University' },
    { label: 'Yale University', value: 'Yale University' },
    { label: 'Princeton University', value: 'Princeton University' }
  ];

  // Dropdown options including "All"
  get universityOptions() {
    return [{ label: 'All Universities', value: null }, ...this.universities];
  }

  private readonly allowedDomains = ['edu.com', 'university.edu'];

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
    this.registrationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [
        '',
        [Validators.required, Validators.email, allowedDomainValidator(this.allowedDomains)]
      ],
      university: ['', [Validators.required]]
    });
  }

  // Combined filter result bound to p-table
  get filteredUsers() {
    const fn = this.firstNameFilter.trim().toLowerCase();
    const ln = this.lastNameFilter.trim().toLowerCase();
    const em = this.emailFilter.trim().toLowerCase();
    const uni = this.universityFilter;

    return this.users.filter(u => {
      const matchesFirst = !fn || u.firstName.toLowerCase().includes(fn);
      const matchesLast = !ln || u.lastName.toLowerCase().includes(ln);
      const matchesEmail = !em || u.email.toLowerCase().includes(em);
      const matchesUni = uni == null || u.university === uni;
      return matchesFirst && matchesLast && matchesEmail && matchesUni;
    });
  }

  onSubmit() {
    if (!this.registrationForm.valid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const newUser = this.registrationForm.value as {
      firstName: string; lastName: string; email: string; university: string;
    };

    const emailCtrl = this.registrationForm.get('email');
    const newEmail = (newUser.email ?? '').trim().toLowerCase();
    const exists = this.users.some(u => (u.email ?? '').trim().toLowerCase() === newEmail);
    if (exists) {
      const currentErrors = emailCtrl?.errors || {};
      emailCtrl?.setErrors({ ...currentErrors, duplicate: true });
      emailCtrl?.markAsTouched();
      return;
    }

    this.users.push(newUser);
    this.registrationForm.reset();
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.touched && field?.invalid) {
      if (field.errors?.['required']) return 'This field is required';
      if (field.errors?.['minlength']) return 'Minimum length is 2 characters';
      if (field.errors?.['email']) return 'Please enter a valid email';
      if (field.errors?.['domain']) return 'Email domain not allowed';
      if (field.errors?.['duplicate']) return 'This email is already registered.';
    }
    return '';
  }

  deleteUser(index: number): void {
    if (index > -1 && index < this.users.length) {
      this.users.splice(index, 1);
    }
  }

  confirmDelete(index: number): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this user?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteUser(index)
    });
  }
}
