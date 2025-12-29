import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';  
import { MatButtonModule } from '@angular/material/button'; 

export interface DialogMessageData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-dialog-message',
  standalone: true,                     
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './dialog-message.component.html',
  styleUrls: ['./dialog-message.component.css']
})
export class DialogMessageComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogMessageData) { }
}
