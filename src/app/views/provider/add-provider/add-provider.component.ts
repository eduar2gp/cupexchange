import { Component, inject, OnInit } from '@angular/core';

import { ProvidersService } from '../../../core/services/providers.service'
import { Provider } from '../../../model/provider.model'

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-add-provider.component',
  imports: [MatInputModule, MatFormFieldModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-provider.component.html',
  styleUrl: './add-provider.component.css'
})
export class AddProviderComponent implements OnInit {

  private providersService = inject(ProvidersService);

  newProvider: Provider = { name: '', email: '', phone: '', userId: '' };

  selectedFile: File | null = null;

  phoneForm!: FormGroup;

  private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  private readonly phonePattern = /^\d{10}$/; // Assuming 10 digits for simplicity

  constructor(private fb: FormBuilder) { }

  
    ngOnInit() {
      // Initialization happens here
      this.phoneForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [
          Validators.required,
          Validators.pattern(this.emailPattern)
        ]],
        phoneNumber: ['', [
          Validators.required,
          Validators.pattern(this.phonePattern)
        ]],
        providerImage: [null] // Include the file control
      });
    }
  

  get nameControl() {
    return this.phoneForm.get('name')!;
  }
  get emailControl() {
    return this.phoneForm.get('email')!;
  }
  get phoneControl() {
    return this.phoneForm.get('phoneNumber')!;
  }

  saveProvider() {    
    if (this.phoneForm.valid) {
      this.newProvider.userId = localStorage.getItem("userId") ?? undefined;
      this.providersService.createProvider(this.newProvider).subscribe({
        next: (response) => {          
          if (this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile, this.selectedFile.name);
            this.providersService.updateProviderImage(response.id!, formData).subscribe({
              next: (updatedProduct: any) => {
                console.log('Provider image saved successfully!', updatedProduct);
                // Handle success (e.g., navigate, show notification)
              },
              error: (err: any) => {
                console.error('Error saving product:', err);
                // Handle error
              }
            });
          }
        },
        error: (err) => {
          console.error('Error saving product:', err);
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('file selected')
    }
  }

}
