import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../../core/models/user.model';
import { RolesPipe } from '../../../../core/pipes/roles.pipe';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-view-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    RolesPipe,
    ImageUrlPipe
  ],
  templateUrl: './view-user-dialog.component.html',
  styleUrls: ['./view-user-dialog.component.css']
})
export class ViewUserDialogComponent {
  private avatarColors = [
    '#7c4dff', '#651fff', '#6200ea', '#e91e63',
    '#2196f3', '#00bcd4', '#009688', '#4caf50',
    '#ff9800', '#ff5722', '#795548', '#607d8b'
  ];

  constructor(
    public dialogRef: MatDialogRef<ViewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  getInitials(): string {
    const name = this.user.name?.charAt(0) || '';
    const apellidos = this.user.apellidos?.charAt(0) || '';
    return (name + apellidos).toUpperCase() || this.user.username.charAt(0).toUpperCase();
  }

  getAvatarColor(): string {
    const index = this.user.username.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }
}
