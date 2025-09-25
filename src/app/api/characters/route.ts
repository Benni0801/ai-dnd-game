import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, characterData } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!characterData) {
      return NextResponse.json(
        { error: 'Character data is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = database.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create character
    const character = database.createCharacter(userId, characterData);
    
    return NextResponse.json({
      character: {
        id: character.id,
        userId: character.userId,
        name: character.name,
        race: character.race,
        class: character.class,
        background: character.background,
        str: character.str,
        dex: character.dex,
        int: character.int,
        con: character.con,
        wis: character.wis,
        cha: character.cha,
        hp: character.hp,
        inventory: character.inventory,
        level: character.level,
        specialAbilities: character.specialAbilities,
        createdAt: character.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating character:', error);
    if (error instanceof Error && error.message.includes('Character limit reached')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID parameter is required' },
        { status: 400 }
      );
    }

    const characters = database.getCharactersByUserId(userId);
    
    return NextResponse.json({
      characters: characters.map(char => ({
        id: char.id,
        userId: char.userId,
        name: char.name,
        race: char.race,
        class: char.class,
        background: char.background,
        str: char.str,
        dex: char.dex,
        int: char.int,
        con: char.con,
        wis: char.wis,
        cha: char.cha,
        hp: char.hp,
        inventory: char.inventory,
        level: char.level,
        specialAbilities: char.specialAbilities,
        createdAt: char.createdAt
      }))
    });

  } catch (error) {
    console.error('Error getting characters:', error);
    return NextResponse.json(
      { error: 'Failed to get characters' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { characterId, updates } = await request.json();

    if (!characterId) {
      return NextResponse.json(
        { error: 'Character ID is required' },
        { status: 400 }
      );
    }

    const character = database.updateCharacter(characterId, updates);
    
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      character: {
        id: character.id,
        userId: character.userId,
        name: character.name,
        race: character.race,
        class: character.class,
        background: character.background,
        str: character.str,
        dex: character.dex,
        int: character.int,
        con: character.con,
        wis: character.wis,
        cha: character.cha,
        hp: character.hp,
        inventory: character.inventory,
        level: character.level,
        specialAbilities: character.specialAbilities,
        createdAt: character.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');

    if (!characterId) {
      return NextResponse.json(
        { error: 'Character ID parameter is required' },
        { status: 400 }
      );
    }

    const success = database.deleteCharacter(characterId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}




