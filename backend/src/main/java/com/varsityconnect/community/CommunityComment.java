package com.varsityconnect.community;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/* one reply on a post, flat — no threads in v1 */
@Entity
@Table(name = "community_comments")
public class CommunityComment extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "post_id", nullable = false)
  private CommunityPost post;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @Column(name = "body", nullable = false, length = 2000)
  private String body;

  @Column(name = "deleted", nullable = false)
  private boolean deleted = false;

  protected CommunityComment() {
    /* jpa only */
  }

  public CommunityComment(CommunityPost post, User author, String body) {
    this.post = post;
    this.author = author;
    this.body = body;
  }

  public CommunityPost getPost() {
    return post;
  }

  public User getAuthor() {
    return author;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public boolean isDeleted() {
    return deleted;
  }

  public void setDeleted(boolean deleted) {
    this.deleted = deleted;
  }
}
