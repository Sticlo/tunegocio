import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { FirebaseService } from '../../../core/services/firebase.service';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AdminAuthService);
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly firebaseEnabled = this.firebase.enabled;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigate(['/admin/productos']);
    } catch {
      // error handled in service
    } finally {
      this.submitting.set(false);
    }
  }
}
