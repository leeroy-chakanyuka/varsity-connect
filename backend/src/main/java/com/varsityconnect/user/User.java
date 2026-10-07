package com.varsityconnect.user;

import com.varsityconnect.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/* single account table for every role, role decides what you may do */
@Entity
@Table(name = "users")
public class User extends AuditableEntity {

  @Column(name = "full_name", nullable = false, length = 120)
  private String fullName;

  @Column(name = "email", nullable = false, unique = true, length = 180)
  private String email;

  /* never serialized, never logged, only ever bcrypt-compared */
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "student_number", unique = true, length = 40)
  private String studentNumber;

  @Column(name = "faculty", length = 120)
  private String faculty;

  @Column(name = "phone_number", length = 40)
  private String phoneNumber;

  @Column(name = "bio", length = 1000)
  private String bio;

  @Column(name = "profile_image_url", length = 500)
  private String profileImageUrl;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false, length = 20)
  private UserRole role;

  @Column(name = "enabled", nullable = false)
  private boolean enabled = true;

  protected User() {
    /* jpa only */
  }

  public User(
      String fullName,
      String email,
      String passwordHash,
      String studentNumber,
      String faculty,
      UserRole role) {
    this.fullName = fullName;
    this.email = email;
    this.passwordHash = passwordHash;
    this.studentNumber = studentNumber;
    this.faculty = faculty;
    this.role = role;
    this.enabled = true;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getStudentNumber() {
    return studentNumber;
  }

  public void setStudentNumber(String studentNumber) {
    this.studentNumber = studentNumber;
  }

  public String getFaculty() {
    return faculty;
  }

  public void setFaculty(String faculty) {
    this.faculty = faculty;
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  public String getBio() {
    return bio;
  }

  public void setBio(String bio) {
    this.bio = bio;
  }

  public String getProfileImageUrl() {
    return profileImageUrl;
  }

  public void setProfileImageUrl(String profileImageUrl) {
    this.profileImageUrl = profileImageUrl;
  }

  public UserRole getRole() {
    return role;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }
}
