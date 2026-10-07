package com.varsityconnect.community;

import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* thread workflows, moderation is owner-or-admin everywhere */
@Service
public class CommunityService {

  private final CommunityPostRepository posts;
  private final CommunityCommentRepository comments;
  private final UserRepository users;

  public CommunityService(
      CommunityPostRepository posts,
      CommunityCommentRepository comments,
      UserRepository users) {
    this.posts = posts;
    this.comments = comments;
    this.users = users;
  }

  @Transactional
  public PostResponse createPost(UserPrincipal principal, CreatePostRequest body) {
    User author =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    CommunityPost post =
        new CommunityPost(
            author, body.title().trim(), body.body().trim(), blankToNull(body.imageUrl()));
    return PostResponse.from(posts.save(post));
  }

  @Transactional(readOnly = true)
  public PageResponse<PostResponse> browse(String search, Pageable pageable) {
    Page<CommunityPost> page =
        search == null || search.isBlank()
            ? posts.findByDeletedFalse(pageable)
            : posts.search(search.trim(), pageable);
    return new PageResponse<>(
        page.getContent().stream().map(PostResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional(readOnly = true)
  public PostResponse detail(UUID id) {
    CommunityPost post = livePost(id);
    return PostResponse.from(post);
  }

  @Transactional
  public PostResponse updatePost(UUID id, UserPrincipal principal, UpdatePostRequest body) {
    CommunityPost post = livePost(id);
    requirePostOwner(post, principal);
    if (body.title() != null && !body.title().isBlank()) {
      post.setTitle(body.title().trim());
    }
    if (body.body() != null && !body.body().isBlank()) {
      post.setBody(body.body().trim());
    }
    if (body.imageUrl() != null) {
      post.setImageUrl(blankToNull(body.imageUrl()));
    }
    return PostResponse.from(posts.save(post));
  }

  @Transactional
  public void deletePost(UUID id, UserPrincipal principal) {
    CommunityPost post = livePost(id);
    requirePostOwnerOrAdmin(post, principal);
    post.setDeleted(true);
    posts.save(post);
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> commentsOf(UUID postId) {
    livePost(postId);
    return comments.findByPostIdAndDeletedFalseOrderByCreatedAtAsc(postId).stream()
        .map(CommentResponse::from)
        .toList();
  }

  @Transactional
  public CommentResponse comment(UUID postId, UserPrincipal principal, CreateCommentRequest body) {
    CommunityPost post = livePost(postId);
    User author =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    CommunityComment comment = comments.save(new CommunityComment(post, author, body.body().trim()));
    post.setCommentCount(post.getCommentCount() + 1);
    posts.save(post);
    return CommentResponse.from(comment);
  }

  @Transactional
  public CommentResponse updateComment(UUID id, UserPrincipal principal, UpdateCommentRequest body) {
    CommunityComment comment = liveComment(id);
    if (!comment.getAuthor().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "only the author may edit this comment");
    }
    if (body.body() != null && !body.body().isBlank()) {
      comment.setBody(body.body().trim());
    }
    return CommentResponse.from(comments.save(comment));
  }

  @Transactional
  public void deleteComment(UUID id, UserPrincipal principal) {
    CommunityComment comment = liveComment(id);
    boolean owner = comment.getAuthor().getId().equals(principal.id());
    if (!owner && principal.role() != UserRole.ADMIN) {
      throw new ForbiddenException("FORBIDDEN", "only the author may delete this comment");
    }
    comment.setDeleted(true);
    comments.save(comment);
    CommunityPost post = comment.getPost();
    post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
    posts.save(post);
  }

  private CommunityPost livePost(UUID id) {
    CommunityPost post =
        posts.findById(id).orElseThrow(() -> new NotFoundException("post not found"));
    if (post.isDeleted()) {
      throw new NotFoundException("post not found");
    }
    return post;
  }

  private CommunityComment liveComment(UUID id) {
    CommunityComment comment =
        comments.findById(id).orElseThrow(() -> new NotFoundException("comment not found"));
    if (comment.isDeleted() || comment.getPost().isDeleted()) {
      throw new NotFoundException("comment not found");
    }
    return comment;
  }

  private void requirePostOwner(CommunityPost post, UserPrincipal principal) {
    if (!post.getAuthor().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "only the author may edit this post");
    }
  }

  private void requirePostOwnerOrAdmin(CommunityPost post, UserPrincipal principal) {
    boolean owner = post.getAuthor().getId().equals(principal.id());
    if (!owner && principal.role() != UserRole.ADMIN) {
      throw new ForbiddenException("FORBIDDEN", "only the author may delete this post");
    }
  }

  private static String blankToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
