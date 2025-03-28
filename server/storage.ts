import {
  users, User, InsertUser,
  posts, Post, InsertPost,
  polls, Poll, InsertPoll,
  pollOptions, PollOption, InsertPollOption,
  pollVotes, PollVote, InsertPollVote,
  likes, Like, InsertLike,
  comments, Comment, InsertComment,
  follows, Follow, InsertFollow,
  conversations, Conversation, InsertConversation,
  conversationParticipants, ConversationParticipant, InsertConversationParticipant,
  messages, Message, InsertMessage,
  echoLinks, EchoLink, InsertEchoLink,
  anonymousMessages, AnonymousMessage, InsertAnonymousMessage,
  notifications, Notification, InsertNotification
} from "@shared/schema";

// Interface for updating user profile
interface UpdateUserData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: UpdateUserData): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Posts
  getPosts(): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  getFeedForUser(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: number): Promise<boolean>;
  
  // Polls
  createPoll(poll: InsertPoll): Promise<Poll>;
  createPollOption(option: InsertPollOption): Promise<PollOption>;
  getPollsByPostId(postId: number): Promise<Poll[]>;
  getPollById(id: number): Promise<Poll | undefined>;
  getPollOptions(pollId: number): Promise<PollOption[]>;
  getPollVotes(pollId: number): Promise<PollVote[]>;
  createPollVote(vote: InsertPollVote): Promise<PollVote>;
  
  // Likes
  getLikesByPostId(postId: number): Promise<Like[]>;
  getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: number): Promise<boolean>;
  
  // Comments
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Follows
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(id: number): Promise<boolean>;
  
  // Conversations
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]>;
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  
  // Messages
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Echo Links
  getEchoLinkById(id: number): Promise<EchoLink | undefined>;
  getEchoLinkByLinkId(linkId: string): Promise<EchoLink | undefined>;
  getEchoLinkByUserId(userId: number): Promise<EchoLink | undefined>;
  createEchoLink(echoLink: InsertEchoLink): Promise<EchoLink>;
  updateEchoLink(id: number, updates: Partial<InsertEchoLink>): Promise<EchoLink | undefined>;
  
  // Anonymous Messages
  getAnonymousMessagesByEchoLinkId(echoLinkId: number): Promise<AnonymousMessage[]>;
  createAnonymousMessage(message: InsertAnonymousMessage): Promise<AnonymousMessage>;
  updateAnonymousMessage(id: number, updates: Partial<InsertAnonymousMessage>): Promise<AnonymousMessage | undefined>;
  
  // Notifications
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private polls: Map<number, Poll>;
  private pollOptions: Map<number, PollOption>;
  private pollVotes: Map<number, PollVote>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  private conversations: Map<number, Conversation>;
  private conversationParticipants: Map<number, ConversationParticipant>;
  private messages: Map<number, Message>;
  private echoLinks: Map<number, EchoLink>;
  private anonymousMessages: Map<number, AnonymousMessage>;
  private notifications: Map<number, Notification>;
  
  private userIdCounter = 2; // Start from 2 since we've added a demo user with ID 1
  private postIdCounter = 1;
  private pollIdCounter = 1;
  private pollOptionIdCounter = 1;
  private pollVoteIdCounter = 1;
  private likeIdCounter = 1;
  private commentIdCounter = 1;
  private followIdCounter = 1;
  private conversationIdCounter = 1;
  private conversationParticipantIdCounter = 1;
  private messageIdCounter = 1;
  private echoLinkIdCounter = 1;
  private anonymousMessageIdCounter = 1;
  private notificationIdCounter = 1;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.polls = new Map();
    this.pollOptions = new Map();
    this.pollVotes = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    this.conversations = new Map();
    this.conversationParticipants = new Map();
    this.messages = new Map();
    this.echoLinks = new Map();
    this.anonymousMessages = new Map();
    this.notifications = new Map();
    
    // Add a demo user
    const demoUser: User = {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      password: 'password',
      displayName: 'Demo User',
      createdAt: new Date(),
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
      bio: 'This is a demo user account for testing purposes.'
    };
    this.users.set(demoUser.id, demoUser);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      avatar: insertUser.avatar || null,
      bio: insertUser.bio || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...user,
      displayName: data.displayName !== undefined ? data.displayName : user.displayName,
      bio: data.bio !== undefined ? data.bio : user.bio,
      avatar: data.avatar !== undefined ? data.avatar : user.avatar
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (user) => 
        user.username.toLowerCase().includes(lowerQuery) ||
        user.displayName.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Posts
  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFeedForUser(userId: number): Promise<Post[]> {
    // Get users that the current user follows
    const following = await this.getFollowing(userId);
    const followingIds = following.map(user => user.id);
    
    // Get posts from users that the current user follows + their own posts
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId || followingIds.includes(post.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      createdAt: now,
      mediaUrl: insertPost.mediaUrl || null,
      mediaType: insertPost.mediaType || null
    };
    this.posts.set(id, post);
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }
  
  // Polls
  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const id = this.pollIdCounter++;
    const now = new Date();
    const poll: Poll = {
      ...insertPoll,
      id,
      createdAt: now,
      isAnonymous: insertPoll.isAnonymous || null
    };
    this.polls.set(id, poll);
    return poll;
  }

  async createPollOption(insertOption: InsertPollOption): Promise<PollOption> {
    const id = this.pollOptionIdCounter++;
    const now = new Date();
    const option: PollOption = {
      ...insertOption,
      id,
      createdAt: now
    };
    this.pollOptions.set(id, option);
    return option;
  }

  async getPollsByPostId(postId: number): Promise<Poll[]> {
    return Array.from(this.polls.values())
      .filter(poll => poll.postId === postId);
  }

  async getPollById(id: number): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async getPollOptions(pollId: number): Promise<PollOption[]> {
    return Array.from(this.pollOptions.values())
      .filter(option => option.pollId === pollId);
  }

  async getPollVotes(pollId: number): Promise<PollVote[]> {
    return Array.from(this.pollVotes.values())
      .filter(vote => vote.pollId === pollId);
  }

  async createPollVote(insertVote: InsertPollVote): Promise<PollVote> {
    // Check if user already voted in this poll
    const existingVote = Array.from(this.pollVotes.values())
      .find(vote => vote.pollId === insertVote.pollId && vote.userId === insertVote.userId);
    
    if (existingVote) {
      // Remove the existing vote
      this.pollVotes.delete(existingVote.id);
    }
    
    const id = this.pollVoteIdCounter++;
    const now = new Date();
    const vote: PollVote = {
      ...insertVote,
      id,
      createdAt: now
    };
    this.pollVotes.set(id, vote);
    return vote;
  }
  
  // Likes
  async getLikesByPostId(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }

  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values())
      .find(like => like.userId === userId && like.postId === postId);
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.likeIdCounter++;
    const now = new Date();
    const like: Like = {
      ...insertLike,
      id,
      createdAt: now
    };
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(id: number): Promise<boolean> {
    return this.likes.delete(id);
  }
  
  // Comments
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now
    };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Follows
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);
    
    return Array.from(this.users.values())
      .filter(user => followerIds.includes(user.id));
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    return Array.from(this.users.values())
      .filter(user => followingIds.includes(user.id));
  }

  async getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined> {
    return Array.from(this.follows.values())
      .find(follow => follow.followerId === followerId && follow.followingId === followingId);
  }

  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const id = this.followIdCounter++;
    const now = new Date();
    const follow: Follow = {
      ...insertFollow,
      id,
      createdAt: now
    };
    this.follows.set(id, follow);
    return follow;
  }

  async deleteFollow(id: number): Promise<boolean> {
    return this.follows.delete(id);
  }
  
  // Conversations
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    // Get conversation IDs where the user is a participant
    const conversationIds = Array.from(this.conversationParticipants.values())
      .filter(participant => participant.userId === userId)
      .map(participant => participant.conversationId);
    
    // Get those conversations
    return Array.from(this.conversations.values())
      .filter(conversation => conversationIds.includes(conversation.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      name: insertConversation.name || null,
      isGroup: insertConversation.isGroup || null
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return Array.from(this.conversationParticipants.values())
      .filter(participant => participant.conversationId === conversationId);
  }

  async addConversationParticipant(insertParticipant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const id = this.conversationParticipantIdCounter++;
    const now = new Date();
    const participant: ConversationParticipant = {
      ...insertParticipant,
      id,
      createdAt: now
    };
    this.conversationParticipants.set(id, participant);
    return participant;
  }
  
  // Messages
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }
  
  // Echo Links
  async getEchoLinkById(id: number): Promise<EchoLink | undefined> {
    return this.echoLinks.get(id);
  }

  async getEchoLinkByLinkId(linkId: string): Promise<EchoLink | undefined> {
    return Array.from(this.echoLinks.values())
      .find(link => link.linkId === linkId);
  }

  async getEchoLinkByUserId(userId: number): Promise<EchoLink | undefined> {
    return Array.from(this.echoLinks.values())
      .find(link => link.userId === userId);
  }

  async createEchoLink(insertEchoLink: InsertEchoLink): Promise<EchoLink> {
    const id = this.echoLinkIdCounter++;
    const now = new Date();
    const echoLink: EchoLink = {
      ...insertEchoLink,
      id,
      createdAt: now,
      welcomeMessage: insertEchoLink.welcomeMessage || null,
      active: insertEchoLink.active || null
    };
    this.echoLinks.set(id, echoLink);
    return echoLink;
  }

  async updateEchoLink(id: number, updates: Partial<InsertEchoLink>): Promise<EchoLink | undefined> {
    const echoLink = this.echoLinks.get(id);
    if (!echoLink) return undefined;
    
    const updatedEchoLink: EchoLink = {
      ...echoLink,
      ...updates
    };
    
    this.echoLinks.set(id, updatedEchoLink);
    return updatedEchoLink;
  }
  
  // Anonymous Messages
  async getAnonymousMessagesByEchoLinkId(echoLinkId: number): Promise<AnonymousMessage[]> {
    return Array.from(this.anonymousMessages.values())
      .filter(message => message.echoLinkId === echoLinkId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAnonymousMessage(insertMessage: InsertAnonymousMessage): Promise<AnonymousMessage> {
    const id = this.anonymousMessageIdCounter++;
    const now = new Date();
    const message: AnonymousMessage = {
      ...insertMessage,
      id,
      createdAt: now,
      answered: insertMessage.answered || null
    };
    this.anonymousMessages.set(id, message);
    return message;
  }

  async updateAnonymousMessage(id: number, updates: Partial<InsertAnonymousMessage>): Promise<AnonymousMessage | undefined> {
    const message = this.anonymousMessages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: AnonymousMessage = {
      ...message,
      ...updates
    };
    
    this.anonymousMessages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Notifications
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: now,
      referenceId: insertNotification.referenceId || null,
      read: insertNotification.read || false
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: Notification = {
      ...notification,
      read: true
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    let success = true;
    
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .forEach(notification => {
        const updatedNotification: Notification = {
          ...notification,
          read: true
        };
        this.notifications.set(notification.id, updatedNotification);
      });
    
    return success;
  }
}

export const storage = new MemStorage();
