package com.varsityconnect.community;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/* one discussion thread, soft-deleted so comments keep their context */
@Entity
@Table(name = "community_posts")
public class CommunityPost extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @Column(name = "title", nullable = false, length = 150)
  private String title;

  @Column(name = "body", nullable = false, length = 5000)
  private String body;

  @Column(name = "image_url", length = 500)
  private String imageUrl;

  @Column(name = "pinned", nullable = false)
  private boolean pinned = false;

  @Column(name = "deleted", nullable = false)
  private boolean deleted = false;

  @Column(name = "comment_count", nullable = false)
  private long commentCount = 0;

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("createdAt ASC")
  private List<CommunityComment> comments = new ArrayList<>();

  protected CommunityPost() {
    /* jpa only */
  }

  public CommunityPost(User author, String title, String body, String imageUrl) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.imageUrl = imageUrl;
  }

  public User getAuthor() {
    return author;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public boolean isPinned() {
    return pinned;
  }

  public boolean isDeleted() {
    return deleted;
  }

  public void setDeleted(boolean deleted) {
    this.deleted = deleted;
  }

  public long getCommentCount() {
    return commentCount;
  }

  public void setCommentCount(long commentCount) {
    this.commentCount = commentCount;
  }

  public List<CommunityComment> getComments() {
    return comments;
  }
}
