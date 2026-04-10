import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../../../core/models/user.model';
import { RolesPipe } from '../../../../core/pipes/roles.pipe';

@Component({
  selector: 'app-view-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    RolesPipe
  ],
  templateUrl: './view-user-dialog.component.html',
  styleUrls: ['./view-user-dialog.component.css']
})
export class ViewUserDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
