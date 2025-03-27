import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { WebSocket } from "ws";
import { upload, uploadToCloudinary } from './cloudinary';
import fs from 'fs';
import path from 'path';
import { 
  insertUserSchema, 
  insertPostSchema, 
  insertPollSchema, 
  insertPollOptionSchema,
  insertPollVoteSchema,
  insertCommentSchema,
  insertLikeSchema,
  insertFollowSchema,
  insertConversationSchema,
  insertConversationParticipantSchema,
  insertMessageSchema,
  insertEchoLinkSchema,
  insertAnonymousMessageSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Map to store active client connections
const clients = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          // Authenticate the WebSocket connection
          userId = data.userId;
          if (userId) {
            clients.set(userId, ws);
          }
        } else if (data.type === 'message') {
          // Handle new message
          if (!userId) return;
          
          try {
            const message = await storage.createMessage({
              conversationId: data.conversationId,
              senderId: userId,
              content: data.content
            });
            
            // Get participants of the conversation
            const participants = await storage.getConversationParticipants(data.conversationId);
            
            // Send the message to all participants
            for (const participant of participants) {
              const client = clients.get(participant.userId);
              if (client && client.readyState === WebSocket.OPEN && participant.userId !== userId) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  message
                }));
                
                // Create notification
                await storage.createNotification({
                  userId: participant.userId,
                  type: 'message',
                  content: 'You have a new message',
                  referenceId: message.id,
                  read: false
                });
              }
            }
          } catch (error) {
            console.error('Error handling message:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });
  
  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // User routes
  app.get('/api/users/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      const users = await storage.searchUsers(query);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
      
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Post routes
  app.get('/api/posts', async (req: Request, res: Response) => {
    try {
      const posts = await storage.getPosts();
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/posts/feed/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const posts = await storage.getFeedForUser(userId);
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      return res.status(200).json(post);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/users/:userId/posts', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const posts = await storage.getPostsByUserId(userId);
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Media upload route
  app.post('/api/media/upload', upload.single('media'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file.path, resourceType);
      
      // Delete the file from local storage after upload
      fs.unlinkSync(file.path);
      
      return res.status(200).json({
        url: result.secure_url,
        mediaType: resourceType
      });
    } catch (error) {
      console.error('Media upload error:', error);
      return res.status(500).json({ message: 'Failed to upload media' });
    }
  });

  app.post('/api/posts', async (req: Request, res: Response) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      return res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const success = await storage.deletePost(id);
      if (!success) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Poll routes
  app.post('/api/polls', async (req: Request, res: Response) => {
    try {
      const pollData = insertPollSchema.parse(req.body);
      const poll = await storage.createPoll(pollData);
      return res.status(201).json(poll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/poll-options', async (req: Request, res: Response) => {
    try {
      const optionData = insertPollOptionSchema.parse(req.body);
      const option = await storage.createPollOption(optionData);
      return res.status(201).json(option);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/posts/:postId/polls', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const polls = await storage.getPollsByPostId(postId);
      return res.status(200).json(polls);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/polls/:id/options', async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.id);
      if (isNaN(pollId)) {
        return res.status(400).json({ message: 'Invalid poll ID' });
      }
      
      const options = await storage.getPollOptions(pollId);
      return res.status(200).json(options);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/polls/:id/votes', async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.id);
      if (isNaN(pollId)) {
        return res.status(400).json({ message: 'Invalid poll ID' });
      }
      
      const votes = await storage.getPollVotes(pollId);
      return res.status(200).json(votes);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/polls/vote', async (req: Request, res: Response) => {
    try {
      const voteData = insertPollVoteSchema.parse(req.body);
      const vote = await storage.createPollVote(voteData);
      return res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Like routes
  app.get('/api/posts/:postId/likes', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const likes = await storage.getLikesByPostId(postId);
      return res.status(200).json(likes);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/likes', async (req: Request, res: Response) => {
    try {
      const likeData = insertLikeSchema.parse(req.body);
      
      // Check if like already exists
      const existingLike = await storage.getLikeByUserAndPost(likeData.userId, likeData.postId);
      if (existingLike) {
        return res.status(400).json({ message: 'User already liked this post' });
      }
      
      const like = await storage.createLike(likeData);
      
      // Get the post
      const post = await storage.getPostById(likeData.postId);
      if (post && post.userId !== likeData.userId) {
        // Create notification for post owner
        await storage.createNotification({
          userId: post.userId,
          type: 'like',
          content: 'Someone liked your post',
          referenceId: post.id,
          read: false
        });
      }
      
      return res.status(201).json(like);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/likes/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid like ID' });
      }
      
      const success = await storage.deleteLike(id);
      if (!success) {
        return res.status(404).json({ message: 'Like not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Comment routes
  app.get('/api/posts/:postId/comments', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const comments = await storage.getCommentsByPostId(postId);
      return res.status(200).json(comments);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/comments', async (req: Request, res: Response) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      
      // Get the post
      const post = await storage.getPostById(commentData.postId);
      if (post && post.userId !== commentData.userId) {
        // Create notification for post owner
        await storage.createNotification({
          userId: post.userId,
          type: 'comment',
          content: 'Someone commented on your post',
          referenceId: post.id,
          read: false
        });
      }
      
      return res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/comments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }
      
      const success = await storage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Follow routes
  app.get('/api/users/:userId/followers', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const followers = await storage.getFollowers(userId);
      
      // Remove passwords from response
      const followersWithoutPasswords = followers.map(({ password, ...rest }) => rest);
      
      return res.status(200).json(followersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/users/:userId/following', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const following = await storage.getFollowing(userId);
      
      // Remove passwords from response
      const followingWithoutPasswords = following.map(({ password, ...rest }) => rest);
      
      return res.status(200).json(followingWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/follows', async (req: Request, res: Response) => {
    try {
      const followData = insertFollowSchema.parse(req.body);
      
      // Check if already following
      const existingFollow = await storage.getFollowByUserIds(followData.followerId, followData.followingId);
      if (existingFollow) {
        return res.status(400).json({ message: 'Already following this user' });
      }
      
      const follow = await storage.createFollow(followData);
      
      // Create notification for followed user
      await storage.createNotification({
        userId: followData.followingId,
        type: 'follow',
        content: 'Someone followed you',
        referenceId: followData.followerId,
        read: false
      });
      
      return res.status(201).json(follow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/follows/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid follow ID' });
      }
      
      const success = await storage.deleteFollow(id);
      if (!success) {
        return res.status(404).json({ message: 'Follow relationship not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Conversation and messaging routes
  app.get('/api/users/:userId/conversations', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const conversations = await storage.getConversationsByUserId(userId);
      return res.status(200).json(conversations);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      const conversation = await storage.getConversationById(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      return res.status(200).json(conversation);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/conversations', async (req: Request, res: Response) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(conversationData);
      return res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/conversations/:id/participants', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      const participants = await storage.getConversationParticipants(id);
      return res.status(200).json(participants);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/conversation-participants', async (req: Request, res: Response) => {
    try {
      const participantData = insertConversationParticipantSchema.parse(req.body);
      const participant = await storage.addConversationParticipant(participantData);
      return res.status(201).json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      const messages = await storage.getMessagesByConversationId(id);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Echo Link routes
  app.get('/api/users/:userId/echo-link', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const echoLink = await storage.getEchoLinkByUserId(userId);
      if (!echoLink) {
        return res.status(404).json({ message: 'Echo Link not found' });
      }
      
      return res.status(200).json(echoLink);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/echo-links/:linkId', async (req: Request, res: Response) => {
    try {
      const linkId = req.params.linkId;
      
      const echoLink = await storage.getEchoLinkByLinkId(linkId);
      if (!echoLink) {
        return res.status(404).json({ message: 'Echo Link not found' });
      }
      
      return res.status(200).json(echoLink);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/echo-links', async (req: Request, res: Response) => {
    try {
      const echoLinkData = insertEchoLinkSchema.parse(req.body);
      
      // Check if user already has an Echo Link
      const existingLink = await storage.getEchoLinkByUserId(echoLinkData.userId);
      if (existingLink) {
        return res.status(400).json({ message: 'User already has an Echo Link' });
      }
      
      const echoLink = await storage.createEchoLink(echoLinkData);
      return res.status(201).json(echoLink);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch('/api/echo-links/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid Echo Link ID' });
      }
      
      const updates = req.body;
      const updatedLink = await storage.updateEchoLink(id, updates);
      
      if (!updatedLink) {
        return res.status(404).json({ message: 'Echo Link not found' });
      }
      
      return res.status(200).json(updatedLink);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Anonymous Messages routes
  app.get('/api/echo-links/:id/messages', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid Echo Link ID' });
      }
      
      const messages = await storage.getAnonymousMessagesByEchoLinkId(id);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/anonymous-messages', async (req: Request, res: Response) => {
    try {
      const messageData = insertAnonymousMessageSchema.parse(req.body);
      const message = await storage.createAnonymousMessage(messageData);
      
      // Get the Echo Link and user
      const echoLink = await storage.getEchoLinkById(messageData.echoLinkId);
      
      if (echoLink) {
        // Create notification for Echo Link owner
        await storage.createNotification({
          userId: echoLink.userId,
          type: 'anonymous_message',
          content: 'You received an anonymous message',
          referenceId: message.id,
          read: false
        });
      }
      
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch('/api/anonymous-messages/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }
      
      const updates = req.body;
      const updatedMessage = await storage.updateAnonymousMessage(id, updates);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      return res.status(200).json(updatedMessage);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Notification routes
  app.get('/api/users/:userId/notifications', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const notifications = await storage.getNotificationsByUserId(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      return res.status(200).json(notification);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/users/:userId/notifications/read-all', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to mark notifications as read' });
      }
      
      return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
